import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentNode } from "graphql";
import { useApolloClient, useQuery } from "@apollo/client/react";
import {
  ADMIN_TASK,
  ADMIN_TASKS,
  ADMIN_TASK_STATS,
  ADMIN_TASK_TEAM,
  ADD_ADMIN_TASK_CHECKLIST_ITEM,
  ADD_ADMIN_TASK_COMMENT,
  ASSIGN_ADMIN_TASK,
  CHANGE_ADMIN_TASK_STATUS,
  CREATE_ADMIN_TASK,
  MY_ADMIN_TASK_COUNTS,
  REMOVE_ADMIN_TASK_CHECKLIST_ITEM,
  SET_ADMIN_TASK_CHECKLIST_ITEM_DONE,
  UPDATE_ADMIN_TASK,
} from "@/services/networks/graphql/admin/tasks";
import type {
  AdminTask,
  AdminTaskDetail,
  AdminTaskStatus,
  AdminTaskTeam,
} from "@/lib/adminTasks";

export interface AdminTaskListInput {
  view?: "TEAM" | "MINE" | "CREATED_BY_ME";
  statuses?: AdminTaskStatus[];
  assigneeId?: string;
  overdueOnly?: boolean;
  sort?: "CREATED_DESC" | "DUE_ASC";
  limit?: number;
  cursor?: string;
}

export interface AdminTaskMemberStats {
  admin: { id: string; email: string };
  todo: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  doneLast7Days: number;
  avgHoursToDone?: number | null;
}
export interface AdminTaskStatsData {
  members: AdminTaskMemberStats[];
  totals: { open: number; overdue: number; blocked: number; doneLast7Days: number };
}

/** The poll that keeps the nav badge honest without a tight loop. */
export const TASK_COUNTS_POLL_MS = 60_000;
/** Focus events can come in bursts (alt-tab, devtools); don't refetch more often than this. */
const FOCUS_REFETCH_MIN_GAP_MS = 5_000;

/** Queries every task mutation refreshes (active ones only; others are not fetched). */
const REFRESH_AFTER_MUTATION = ["AdminTasks", "AdminTaskStats", "MyAdminTaskCounts"];

export function useAdminTaskTeam() {
  const query = useQuery<{ adminTaskTeam: AdminTaskTeam }>(ADMIN_TASK_TEAM);
  return { ...query, team: query.data?.adminTaskTeam };
}

export function useAdminTaskStats() {
  const query = useQuery<{ adminTaskStats: AdminTaskStatsData }>(ADMIN_TASK_STATS, {
    fetchPolicy: "cache-and-network",
  });
  return { ...query, stats: query.data?.adminTaskStats };
}

export function useAdminTaskDetail(id: string | null) {
  const query = useQuery<{ adminTask: AdminTaskDetail }>(ADMIN_TASK, {
    variables: { id: id ?? "" },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });
  return { ...query, detail: query.data?.adminTask };
}

/** One page-at-a-time task list; "Load more" follows `nextCursor`. */
export function useAdminTaskList(input: AdminTaskListInput, options?: { skip?: boolean }) {
  const query = useQuery<{ adminTasks: { tasks: AdminTask[]; nextCursor?: string | null } }>(ADMIN_TASKS, {
    variables: { input },
    skip: options?.skip,
    fetchPolicy: "cache-and-network",
  });
  const { fetchMore } = query;
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<unknown>(null);
  const nextCursor = query.data?.adminTasks.nextCursor ?? null;

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      await fetchMore({
        variables: { input: { ...input, cursor: nextCursor } },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previous;
          const seen = new Set(previous.adminTasks.tasks.map((t) => t.id));
          const added = fetchMoreResult.adminTasks.tasks.filter((t) => !seen.has(t.id));
          return {
            adminTasks: {
              ...fetchMoreResult.adminTasks,
              tasks: [...previous.adminTasks.tasks, ...added],
            },
          };
        },
      });
    } catch (err) {
      setMoreError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchMore, input, nextCursor]);

  return {
    tasks: useMemo(() => query.data?.adminTasks.tasks ?? [], [query.data]),
    nextCursor,
    loading: query.loading,
    loadingMore,
    error: query.error ?? moreError,
    refetch: query.refetch,
    loadMore,
  };
}

/**
 * Open / overdue counts for the nav badge. Refreshes on window focus and on a
 * slow poll that only runs while the tab is visible.
 */
export function useMyTaskCounts() {
  const query = useQuery<{ myAdminTaskCounts: { open: number; overdue: number } }>(MY_ADMIN_TASK_COUNTS, {
    fetchPolicy: "cache-and-network",
  });
  const { refetch } = query;
  const lastFetch = useRef(Date.now());

  useEffect(() => {
    const refresh = (force: boolean) => {
      const now = Date.now();
      if (!force && now - lastFetch.current < FOCUS_REFETCH_MIN_GAP_MS) return;
      lastFetch.current = now;
      void Promise.resolve(refetch()).catch((): undefined => undefined);
    };
    const onFocus = () => refresh(false);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh(true);
    }, TASK_COUNTS_POLL_MS);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [refetch]);

  return query.data?.myAdminTaskCounts ?? null;
}

/**
 * The admin Apollo client uses errorPolicy "all": a refused mutation RESOLVES
 * with `error`/`errors` and no data. Every action below therefore throws unless
 * the result has no errors AND carries the task detail — callers show a success
 * message only after the returned promise resolves.
 */
export function useAdminTaskActions() {
  const client = useApolloClient();

  const run = useCallback(
    async (mutation: DocumentNode, variables: Record<string, unknown>, field: string): Promise<AdminTaskDetail> => {
      const result = (await client.mutate({ mutation, variables })) as unknown as {
        data?: Record<string, AdminTaskDetail | null> | null;
        error?: unknown;
        errors?: ReadonlyArray<unknown>;
      };
      if (result.error) throw result.error;
      if (result.errors?.length) throw { errors: result.errors };
      const detail = result.data?.[field];
      if (!detail) throw new Error("empty task mutation result");

      try {
        client.writeQuery({ query: ADMIN_TASK, variables: { id: detail.task.id }, data: { adminTask: detail } });
      } catch {
        // The drawer will simply refetch; a failed cache write must not turn a success into a failure.
      }
      try {
        void Promise.resolve(client.refetchQueries({ include: REFRESH_AFTER_MUTATION })).catch((): undefined => undefined);
      } catch {
        // Refresh is best effort; the 60 s poll and the next focus will catch up.
      }
      return detail;
    },
    [client],
  );

  return useMemo(
    () => ({
      create: (input: Record<string, unknown>) => run(CREATE_ADMIN_TASK, { input }, "createAdminTask"),
      update: (input: Record<string, unknown>) => run(UPDATE_ADMIN_TASK, { input }, "updateAdminTask"),
      assign: (taskId: string, assigneeId: string) =>
        run(ASSIGN_ADMIN_TASK, { taskId, assigneeId }, "assignAdminTask"),
      changeStatus: (taskId: string, status: AdminTaskStatus, blockedReason?: string) =>
        run(
          CHANGE_ADMIN_TASK_STATUS,
          blockedReason === undefined ? { taskId, status } : { taskId, status, blockedReason },
          "changeAdminTaskStatus",
        ),
      addItem: (taskId: string, text: string) =>
        run(ADD_ADMIN_TASK_CHECKLIST_ITEM, { taskId, text }, "addAdminTaskChecklistItem"),
      setItemDone: (taskId: string, itemId: string, done: boolean) =>
        run(SET_ADMIN_TASK_CHECKLIST_ITEM_DONE, { taskId, itemId, done }, "setAdminTaskChecklistItemDone"),
      removeItem: (taskId: string, itemId: string) =>
        run(REMOVE_ADMIN_TASK_CHECKLIST_ITEM, { taskId, itemId }, "removeAdminTaskChecklistItem"),
      addComment: (taskId: string, body: string) =>
        run(ADD_ADMIN_TASK_COMMENT, { taskId, body }, "addAdminTaskComment"),
    }),
    [run],
  );
}
