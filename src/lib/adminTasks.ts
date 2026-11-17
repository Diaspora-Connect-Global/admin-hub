/**
 * Admin tasks — types, limits and pure helpers shared by the Tasks screens.
 * Nothing here renders an id: people are shown by email.
 */
import type { TFunction } from "i18next";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"] as const;
export type AdminTaskStatus = (typeof TASK_STATUSES)[number];
export const OPEN_STATUSES: AdminTaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED"];
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type AdminTaskPriority = (typeof TASK_PRIORITIES)[number];

export interface AdminTaskPerson {
  id: string;
  email: string;
  role?: string | null;
}

export interface AdminTaskPermissions {
  canEdit: boolean;
  canReassign: boolean;
  canChangeStatus: boolean;
  canCancel: boolean;
  canManageChecklist: boolean;
  canComment: boolean;
}

export interface AdminTask {
  id: string;
  title: string;
  description?: string | null;
  status: AdminTaskStatus;
  priority: AdminTaskPriority;
  assignee: AdminTaskPerson;
  createdBy: AdminTaskPerson;
  dueAt?: string | null;
  blockedReason?: string | null;
  linkType?: string | null;
  linkId?: string | null;
  checklistTotal: number;
  checklistDone: number;
  commentCount: number;
  overdue: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: AdminTaskPermissions;
}

export interface AdminTaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
  doneAt?: string | null;
  doneBy?: { id: string; email: string } | null;
  position: number;
}
export interface AdminTaskComment {
  id: string;
  author: { id: string; email: string };
  body: string;
  createdAt: string;
}
export interface AdminTaskEvent {
  id: string;
  type: string;
  actor?: { id: string; email: string } | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  note?: string | null;
  createdAt: string;
}
export interface AdminTaskDetail {
  task: AdminTask;
  checklist: AdminTaskChecklistItem[];
  comments: AdminTaskComment[];
  events: AdminTaskEvent[];
}

export interface AdminTaskTeamMember {
  admin: AdminTaskPerson;
  canAssignOthers: boolean;
  isViewer: boolean;
}
export interface AdminTaskTeam {
  members: AdminTaskTeamMember[];
  viewerCanAssignOthers: boolean;
}

/** Limits from the contract; the server enforces them too. */
export const TASK_LIMITS = {
  title: 200,
  description: 5000,
  comment: 2000,
  checklistItem: 300,
  checklistItems: 30,
  blockedReason: 500,
  dueYears: 5,
} as const;

/** `YYYY-MM-DD` (date input) → ISO instant at the END of that day, local time. */
export function endOfLocalDayIso(dateValue: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d, 23, 59, 59, 999);
  // Reject roll-overs such as 2026-02-31.
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date.toISOString();
}

/** Whether the date is no further than the contract's 5 years out. */
export function isWithinDueWindow(iso: string, now = new Date()): boolean {
  const limit = new Date(now);
  limit.setFullYear(limit.getFullYear() + TASK_LIMITS.dueYears);
  return new Date(iso).getTime() <= limit.getTime();
}

/** ISO instant → local `YYYY-MM-DD` for a date input. */
export function isoToDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

/** Average time to finish: hours under a day, days (one decimal) above, "—" when unknown. */
export function formatAvgDuration(hours: number | null | undefined, t: TFunction): string {
  if (hours == null || !Number.isFinite(hours)) return "—";
  if (hours < 24) return t("tasks.progress.hours", { value: Math.max(0.1, Math.round(hours * 10) / 10) });
  return t("tasks.progress.days", { value: Math.round((hours / 24) * 10) / 10 });
}

/** Statuses an admin may move a task to from `status`, per the contract's machine. */
export function allowedMoves(
  task: Pick<AdminTask, "status" | "permissions">,
): { status: AdminTaskStatus; kind: "move" | "reopen" | "restore" | "cancel" }[] {
  const { status, permissions } = task;
  const moves: { status: AdminTaskStatus; kind: "move" | "reopen" | "restore" | "cancel" }[] = [];
  if (status === "CANCELLED") {
    if (permissions.canCancel) moves.push({ status: "TODO", kind: "restore" });
    return moves;
  }
  if (permissions.canChangeStatus) {
    if (status === "DONE") {
      moves.push({ status: "TODO", kind: "reopen" }, { status: "IN_PROGRESS", kind: "reopen" });
    } else {
      for (const s of ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as AdminTaskStatus[]) {
        if (s !== status) moves.push({ status: s, kind: "move" });
      }
    }
  }
  if (permissions.canCancel) moves.push({ status: "CANCELLED", kind: "cancel" });
  return moves;
}

/**
 * Admin-hub routes a linked item can open. Anything not listed gets no link —
 * the href is only ever built from this allow-list.
 */
const LINK_ROUTES: Record<string, string> = {
  USER: "/users/",
  COMMUNITY: "/communities/",
  ASSOCIATION: "/associations/",
  CIRCLE: "/circles/",
};

export function linkedItemRoute(linkType?: string | null, linkId?: string | null): string | null {
  if (!linkType || !linkId) return null;
  const base = LINK_ROUTES[linkType];
  if (!base) return null;
  return `${base}${encodeURIComponent(linkId)}`;
}

export function isLinkableType(linkType?: string | null): boolean {
  return !!linkType && linkType in LINK_ROUTES;
}

const ERROR_CODES = [
  "ADMIN_TASK_NOT_FOUND",
  "ADMIN_TASK_NOT_ALLOWED",
  "ADMIN_TASK_NOT_A_MEMBER",
  "ADMIN_TASK_INVALID_TRANSITION",
  "ADMIN_TASK_LIMIT",
  "ADMIN_TASK_INVALID",
  "ADMIN_TASK_UNAVAILABLE",
] as const;

interface MaybeGraphQLError {
  errors?: ReadonlyArray<{ extensions?: { code?: unknown } }>;
  graphQLErrors?: ReadonlyArray<{ extensions?: { code?: unknown } }>;
  cause?: unknown;
}

/** Pulls `extensions.code` out of an Apollo error (v3 `graphQLErrors` or v4 `errors`). */
export function taskErrorCode(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as MaybeGraphQLError;
  const list = e.errors ?? e.graphQLErrors ?? [];
  for (const item of list) {
    const code = item?.extensions?.code;
    if (typeof code === "string") return code;
  }
  return e.cause ? taskErrorCode(e.cause) : null;
}

/** Friendly sentence for any failure of a task operation. Never echoes server text. */
export function taskErrorMessage(err: unknown, t: TFunction): string {
  const code = taskErrorCode(err);
  if (code && (ERROR_CODES as readonly string[]).includes(code)) {
    return t(`tasks.errors.${code}`);
  }
  return t("tasks.errors.GENERIC");
}

/** Maps a server label that is a status/priority enum to its translation, else leaves it. */
export function labelFor(raw: string | null | undefined, t: TFunction): string {
  if (!raw) return "";
  if ((TASK_STATUSES as readonly string[]).includes(raw)) return t(`tasks.status.${raw}`);
  if ((TASK_PRIORITIES as readonly string[]).includes(raw)) return t(`tasks.priority.${raw}`);
  return raw;
}
