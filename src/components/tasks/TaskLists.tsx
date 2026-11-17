import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useAdminTaskList,
  useAdminTaskStats,
  useAdminTaskTeam,
  type AdminTaskListInput,
} from "@/hooks/admin/useAdminTasks";
import { formatAvgDuration, OPEN_STATUSES, taskErrorMessage, type AdminTask, type AdminTaskStatus } from "@/lib/adminTasks";
import { TaskCard } from "./TaskBits";

type ListState = ReturnType<typeof useAdminTaskList>;

function ListStatus({ list }: { list: ListState }) {
  const { t } = useTranslation();
  if (list.error && list.tasks.length === 0) {
    return (
      <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <p>{taskErrorMessage(list.error, t)}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => void list.refetch()}>
          {t("tasks.retry")}
        </Button>
      </div>
    );
  }
  if (list.loading && list.tasks.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("tasks.loading")}
      </p>
    );
  }
  return null;
}

function LoadMore({ list }: { list: ListState }) {
  const { t } = useTranslation();
  if (!list.nextCursor) return null;
  return (
    <div className="pt-2">
      <Button variant="outline" size="sm" onClick={() => void list.loadMore()} disabled={list.loadingMore}>
        {list.loadingMore ? t("tasks.loading") : t("tasks.loadMore")}
      </Button>
      {list.error && list.tasks.length > 0 && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {taskErrorMessage(list.error, t)}
        </p>
      )}
    </div>
  );
}

function CardGrid({
  tasks,
  onOpen,
  showStatus,
}: {
  tasks: AdminTask[];
  onOpen: (id: string) => void;
  showStatus?: boolean;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskCard task={task} onOpen={onOpen} showStatus={showStatus} />
        </li>
      ))}
    </ul>
  );
}

export function MyTasksTab({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const [showFinished, setShowFinished] = useState(false);
  const input = useMemo<AdminTaskListInput>(
    () => ({
      view: "MINE",
      statuses: showFinished ? [...OPEN_STATUSES, "DONE"] : OPEN_STATUSES,
      sort: "DUE_ASC",
      limit: 50,
    }),
    [showFinished],
  );
  const list = useAdminTaskList(input);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch id="tasks-show-finished" checked={showFinished} onCheckedChange={setShowFinished} />
        <Label htmlFor="tasks-show-finished">{t("tasks.showFinished")}</Label>
      </div>
      <ListStatus list={list} />
      {!list.loading && !list.error && list.tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("tasks.empty")}</p>
      )}
      <CardGrid tasks={list.tasks} onOpen={onOpen} showStatus />
      <LoadMore list={list} />
    </div>
  );
}

export function CreatedByMeTab({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const input = useMemo<AdminTaskListInput>(() => ({ view: "CREATED_BY_ME", sort: "CREATED_DESC", limit: 50 }), []);
  const list = useAdminTaskList(input);
  return (
    <div className="space-y-4">
      <ListStatus list={list} />
      {!list.loading && !list.error && list.tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("tasks.empty")}</p>
      )}
      <CardGrid tasks={list.tasks} onOpen={onOpen} showStatus />
      <LoadMore list={list} />
    </div>
  );
}

const BOARD_COLUMNS: AdminTaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];

export function TeamBoardTab({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const { team } = useAdminTaskTeam();
  const [assigneeId, setAssigneeId] = useState("");

  // Two independent queries fired together (no waterfall): everything open, and the latest finished.
  const openInput = useMemo<AdminTaskListInput>(
    () => ({
      view: "TEAM",
      statuses: OPEN_STATUSES,
      sort: "DUE_ASC",
      limit: 100,
      ...(assigneeId ? { assigneeId } : {}),
    }),
    [assigneeId],
  );
  const doneInput = useMemo<AdminTaskListInput>(
    () => ({
      view: "TEAM",
      statuses: ["DONE"],
      sort: "CREATED_DESC",
      limit: 50,
      ...(assigneeId ? { assigneeId } : {}),
    }),
    [assigneeId],
  );
  const open = useAdminTaskList(openInput);
  const done = useAdminTaskList(doneInput);

  const grouped = useMemo(() => {
    const byStatus: Record<string, AdminTask[]> = { TODO: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] };
    for (const task of open.tasks) byStatus[task.status]?.push(task);
    byStatus.DONE = done.tasks.filter((task) => task.status === "DONE");
    return byStatus;
  }, [open.tasks, done.tasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:max-w-xs">
        <Label htmlFor="tasks-person-filter">{t("tasks.filter.person")}</Label>
        <select
          id="tasks-person-filter"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">{t("tasks.filter.everyone")}</option>
          {team?.members.map((m) => (
            <option key={m.admin.id} value={m.admin.id}>
              {m.admin.email}
            </option>
          ))}
        </select>
      </div>
      <ListStatus list={open} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BOARD_COLUMNS.map((status) => {
          const column = grouped[status];
          const source = status === "DONE" ? done : open;
          return (
            <section key={status} aria-labelledby={`tasks-col-${status}`} className="min-w-0 rounded-lg bg-muted/40 p-3">
              <h3 id={`tasks-col-${status}`} className="mb-3 flex items-center justify-between text-sm font-semibold">
                <span>{t(`tasks.status.${status}`)}</span>
                <span className="text-xs font-normal text-muted-foreground">{column.length}</span>
              </h3>
              <ul className="space-y-2">
                {column.map((task) => (
                  <li key={task.id}>
                    <TaskCard task={task} onOpen={onOpen} />
                  </li>
                ))}
              </ul>
              {column.length === 0 && !source.loading && (
                <p className="text-xs text-muted-foreground">{t("tasks.empty")}</p>
              )}
              {status !== "DONE" ? null : <LoadMore list={done} />}
            </section>
          );
        })}
      </div>
      <LoadMore list={open} />
    </div>
  );
}

export function TeamProgressTab() {
  const { t } = useTranslation();
  const { stats, loading, error, refetch } = useAdminTaskStats();

  if (error && !stats) {
    return (
      <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <p>{taskErrorMessage(error, t)}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
          {t("tasks.retry")}
        </Button>
      </div>
    );
  }
  if (!stats) {
    return loading ? (
      <p className="text-sm text-muted-foreground" role="status">
        {t("tasks.loading")}
      </p>
    ) : null;
  }
  const cell = "px-3 py-2 text-right tabular-nums";
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{t("tasks.progress.caption")}</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">{t("tasks.progress.person")}</th>
            <th scope="col" className={cell}>{t("tasks.status.TODO")}</th>
            <th scope="col" className={cell}>{t("tasks.status.IN_PROGRESS")}</th>
            <th scope="col" className={cell}>{t("tasks.status.BLOCKED")}</th>
            <th scope="col" className={cell}>{t("tasks.progress.overdue")}</th>
            <th scope="col" className={cell}>{t("tasks.progress.doneWeek")}</th>
            <th scope="col" className={cell}>{t("tasks.progress.avg")}</th>
          </tr>
        </thead>
        <tbody>
          {stats.members.map((m) => (
            <tr key={m.admin.id} className="border-t border-border">
              <th scope="row" className="px-3 py-2 text-left font-normal break-all">{m.admin.email}</th>
              <td className={cell}>{m.todo}</td>
              <td className={cell}>{m.inProgress}</td>
              <td className={cell}>{m.blocked}</td>
              <td className={cell}>{m.overdue}</td>
              <td className={cell}>{m.doneLast7Days}</td>
              <td className={cell}>{formatAvgDuration(m.avgHoursToDone, t)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/30 font-medium">
            <th scope="row" className="px-3 py-2 text-left">{t("tasks.progress.totals")}</th>
            <td className={cell} colSpan={3}>
              {t("tasks.progress.totalOpen", { count: stats.totals.open })}
              {stats.totals.blocked > 0 ? ` · ${t("tasks.progress.totalBlocked", { count: stats.totals.blocked })}` : ""}
            </td>
            <td className={cell}>{stats.totals.overdue}</td>
            <td className={cell}>{stats.totals.doneLast7Days}</td>
            <td className={cell}>—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
