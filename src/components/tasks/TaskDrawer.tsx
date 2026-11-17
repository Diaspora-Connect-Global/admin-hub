import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminTaskActions, useAdminTaskDetail, useAdminTaskTeam } from "@/hooks/admin/useAdminTasks";
import {
  allowedMoves,
  endOfLocalDayIso,
  formatDate,
  formatDateTime,
  isLinkableType,
  isoToDateInput,
  isWithinDueWindow,
  labelFor,
  linkedItemRoute,
  TASK_LIMITS,
  TASK_PRIORITIES,
  taskErrorMessage,
  type AdminTaskDetail,
  type AdminTaskEvent,
  type AdminTaskPriority,
  type AdminTaskStatus,
} from "@/lib/adminTasks";
import { TaskDue, TaskPriorityBadge, TaskStatusBadge } from "./TaskBits";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

/** One plain-words sentence per history entry. Uses emails/labels only, never ids. */
export function describeTaskEvent(ev: AdminTaskEvent, t: TFunction, locale: string): string {
  const actor = ev.actor?.email ?? t("tasks.history.system");
  const item = ev.note || ev.toLabel || ev.fromLabel || "";
  const asDate = (label?: string | null) => (label ? formatDate(label, locale) || label : "");
  switch (ev.type) {
    case "CREATED":
      return t("tasks.history.CREATED", { actor });
    case "REASSIGNED":
      return ev.fromLabel
        ? t("tasks.history.REASSIGNED", { actor, from: ev.fromLabel, to: ev.toLabel ?? "" })
        : t("tasks.history.REASSIGNED_TO", { actor, to: ev.toLabel ?? "" });
    case "STATUS_CHANGED":
      return t("tasks.history.STATUS_CHANGED", {
        actor,
        from: labelFor(ev.fromLabel, t),
        to: labelFor(ev.toLabel, t),
      });
    case "PRIORITY_CHANGED":
      return t("tasks.history.PRIORITY_CHANGED", {
        actor,
        from: labelFor(ev.fromLabel, t),
        to: labelFor(ev.toLabel, t),
      });
    case "DUE_CHANGED":
      if (ev.toLabel && ev.fromLabel) {
        return t("tasks.history.DUE_CHANGED", { actor, from: asDate(ev.fromLabel), to: asDate(ev.toLabel) });
      }
      return ev.toLabel
        ? t("tasks.history.DUE_SET", { actor, to: asDate(ev.toLabel) })
        : t("tasks.history.DUE_CLEARED", { actor });
    case "EDITED":
      return t("tasks.history.EDITED", { actor });
    case "CHECKLIST_ITEM_ADDED":
    case "CHECKLIST_ITEM_CHECKED":
    case "CHECKLIST_ITEM_UNCHECKED":
    case "CHECKLIST_ITEM_REMOVED":
      return t(`tasks.history.${ev.type}`, { actor, item });
    case "COMMENTED":
      return t("tasks.history.COMMENTED", { actor });
    default:
      return t("tasks.history.OTHER", { actor });
  }
}

interface TaskDrawerProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const uid = useId();
  const { detail, loading, error: loadError } = useAdminTaskDetail(taskId);
  const { team } = useAdminTaskTeam();
  const actions = useAdminTaskActions();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState("");
  const [newItem, setNewItem] = useState("");
  const [comment, setComment] = useState("");

  const task = detail?.task;

  // Moving to another task (or the server changing this one's status) closes any half-finished form.
  useEffect(() => {
    setEditing(false);
    setBlocking(false);
    setReason("");
    setNewItem("");
    setComment("");
    setError(null);
  }, [taskId]);
  useEffect(() => {
    setBlocking(false);
    setReason("");
  }, [task?.status]);

  /** Runs one mutation. Success feedback is shown only after the server confirmed it. */
  const act = async (fn: () => Promise<AdminTaskDetail>, successKey?: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (successKey) toast({ title: t(successKey) });
      return true;
    } catch (err) {
      setError(taskErrorMessage(err, t));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <SheetHeader className="pr-6 text-left">
      <SheetTitle className="break-words">{task ? task.title : t("tasks.drawer.fallbackTitle")}</SheetTitle>
      <SheetDescription className="sr-only">{t("tasks.drawer.description")}</SheetDescription>
    </SheetHeader>
  );

  let body: ReactNode;
  if (!task) {
    body =
      loadError && !detail ? (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {taskErrorMessage(loadError, t)}
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {loading ? t("tasks.loading") : ""}
        </p>
      );
  } else {
    const p = task.permissions;
    const moves = allowedMoves(task);
    const linkRoute = linkedItemRoute(task.linkType, task.linkId);
    const checklist = detail!.checklist;
    const pct = task.checklistTotal > 0 ? Math.round((task.checklistDone / task.checklistTotal) * 100) : 0;
    const trimmedReason = reason.trim();
    const reasonOk = trimmedReason.length > 0 && trimmedReason.length <= TASK_LIMITS.blockedReason;
    const commentOk = comment.trim().length > 0 && comment.length <= TASK_LIMITS.comment;
    const itemOk = newItem.trim().length > 0 && newItem.trim().length <= TASK_LIMITS.checklistItem;
    const assigneeOptions = [...(team?.members.map((m) => m.admin) ?? [])];
    if (!assigneeOptions.some((a) => a.id === task.assignee.id)) assigneeOptions.push(task.assignee);

    const startEdit = () => {
      setTitleDraft(task.title);
      setDescDraft(task.description ?? "");
      setEditing(true);
    };
    const titleOk = titleDraft.trim().length > 0 && titleDraft.trim().length <= TASK_LIMITS.title;
    const descOk = descDraft.length <= TASK_LIMITS.description;

    body = (
      <div className="mt-4 space-y-6">
        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Summary */}
        <section aria-label={t("tasks.drawer.summary")} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            <TaskDue task={task} />
          </div>
          {task.status === "BLOCKED" && task.blockedReason && (
            <p className="rounded-md bg-muted p-2 text-sm">{t("tasks.drawer.blockedBecause", { reason: task.blockedReason })}</p>
          )}
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`${uid}-title`}>{t("tasks.field.title")}</Label>
                <Input id={`${uid}-title`} value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${uid}-desc`}>{t("tasks.field.description")}</Label>
                <Textarea id={`${uid}-desc`} rows={4} value={descDraft} onChange={(e) => setDescDraft(e.target.value)} />
              </div>
              {(!titleOk || !descOk) && (
                <p className="text-sm text-destructive">
                  {!titleOk
                    ? t("tasks.validation.titleTooLong", { max: TASK_LIMITS.title })
                    : t("tasks.validation.descriptionTooLong", { max: TASK_LIMITS.description })}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy || !titleOk || !descOk}
                  onClick={async () => {
                    const ok = await act(
                      () => actions.update({ taskId: task.id, title: titleDraft.trim(), description: descDraft.trim() }),
                      "tasks.toast.updated",
                    );
                    if (ok) setEditing(false);
                  }}
                >
                  {t("tasks.drawer.save")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  {t("tasks.cancelDialog")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {task.description ? (
                <p className="whitespace-pre-wrap break-words text-sm">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("tasks.drawer.noDescription")}</p>
              )}
              {p.canEdit && (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  {t("tasks.drawer.edit")}
                </Button>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("tasks.drawer.createdBy", { email: task.createdBy.email })}</p>
          {linkRoute && isLinkableType(task.linkType) && (
            <Link to={linkRoute} className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t(`tasks.openLinked.${task.linkType}`)}
            </Link>
          )}
        </section>

        {/* People, priority and due date */}
        <section aria-label={t("tasks.drawer.details")} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${uid}-assignee`}>{t("tasks.field.assignee")}</Label>
            {p.canReassign ? (
              <select
                id={`${uid}-assignee`}
                className={selectClass}
                value={task.assignee.id}
                disabled={busy}
                onChange={(e) => void act(() => actions.assign(task.id, e.target.value), "tasks.toast.reassigned")}
              >
                {assigneeOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.email}
                  </option>
                ))}
              </select>
            ) : (
              <p id={`${uid}-assignee`} className="break-all text-sm">
                {task.assignee.email}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-priority`}>{t("tasks.field.priority")}</Label>
            {p.canEdit ? (
              <select
                id={`${uid}-priority`}
                className={selectClass}
                value={task.priority}
                disabled={busy}
                onChange={(e) =>
                  void act(
                    () => actions.update({ taskId: task.id, priority: e.target.value as AdminTaskPriority }),
                    "tasks.toast.updated",
                  )
                }
              >
                {TASK_PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {t(`tasks.priority.${pr}`)}
                  </option>
                ))}
              </select>
            ) : (
              <p id={`${uid}-priority`} className="text-sm">{t(`tasks.priority.${task.priority}`)}</p>
            )}
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`${uid}-due`}>{t("tasks.field.dueDate")}</Label>
            {p.canEdit ? (
              <div className="flex items-center gap-2">
                <Input
                  id={`${uid}-due`}
                  type="date"
                  value={isoToDateInput(task.dueAt)}
                  disabled={busy}
                  onChange={(e) => {
                    // An empty value (field being edited) is ignored; clearing is the explicit button.
                    const iso = endOfLocalDayIso(e.target.value);
                    if (!iso) return;
                    if (!isWithinDueWindow(iso)) {
                      setError(t("tasks.validation.dueInvalid"));
                      return;
                    }
                    void act(() => actions.update({ taskId: task.id, dueAt: iso }), "tasks.toast.updated");
                  }}
                />
                {task.dueAt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void act(() => actions.update({ taskId: task.id, dueAt: null }), "tasks.toast.updated")}
                  >
                    {t("tasks.drawer.clearDue")}
                  </Button>
                )}
              </div>
            ) : (
              <p id={`${uid}-due`} className="text-sm">
                {task.dueAt ? formatDate(task.dueAt, i18n.language) : t("tasks.card.noDue")}
              </p>
            )}
          </div>
        </section>

        {/* Status moves */}
        {moves.length > 0 && (
          <section aria-label={t("tasks.drawer.statusHeading")} className="space-y-2">
            <h3 className="text-sm font-semibold">{t("tasks.drawer.statusHeading")}</h3>
            <div className="flex flex-wrap gap-2">
              {moves.map((m) => {
                const statusLabel = t(`tasks.status.${m.status}`);
                const label =
                  m.kind === "cancel"
                    ? t("tasks.drawer.cancelTask")
                    : m.kind === "restore"
                      ? t("tasks.drawer.restoreTask")
                      : m.kind === "reopen"
                        ? t("tasks.drawer.reopenAs", { status: statusLabel })
                        : t("tasks.drawer.moveTo", { status: statusLabel });
                return (
                  <Button
                    key={`${m.kind}-${m.status}`}
                    type="button"
                    size="sm"
                    variant={m.kind === "cancel" ? "outline" : "secondary"}
                    disabled={busy}
                    onClick={() => {
                      if (m.status === "BLOCKED") {
                        setBlocking(true);
                        return;
                      }
                      void act(() => actions.changeStatus(task.id, m.status as AdminTaskStatus), "tasks.toast.status");
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
            {blocking && (
              <form
                className="space-y-2 rounded-md bg-muted/50 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reasonOk) return;
                  void act(() => actions.changeStatus(task.id, "BLOCKED", trimmedReason), "tasks.toast.status");
                }}
              >
                <Label htmlFor={`${uid}-reason`}>{t("tasks.drawer.blockedReasonLabel")}</Label>
                <Textarea
                  id={`${uid}-reason`}
                  rows={2}
                  value={reason}
                  required
                  onChange={(e) => setReason(e.target.value)}
                />
                {trimmedReason.length > TASK_LIMITS.blockedReason && (
                  <p className="text-sm text-destructive">
                    {t("tasks.validation.reasonTooLong", { max: TASK_LIMITS.blockedReason })}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busy || !reasonOk}>
                    {t("tasks.drawer.confirmBlocked")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setBlocking(false)}>
                    {t("tasks.cancelDialog")}
                  </Button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Checklist */}
        <section aria-label={t("tasks.checklist.heading")} className="space-y-2">
          <h3 className="text-sm font-semibold">{t("tasks.checklist.heading")}</h3>
          {task.checklistTotal > 0 && (
            <div className="space-y-1">
              <Progress value={pct} aria-label={t("tasks.checklist.heading")} />
              <p className="text-xs text-muted-foreground">
                {t("tasks.checklist.progress", { done: task.checklistDone, total: task.checklistTotal })}
              </p>
            </div>
          )}
          <ul className="space-y-1">
            {checklist.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={`${uid}-item-${index}`}
                  checked={item.done}
                  disabled={!p.canManageChecklist || busy}
                  onCheckedChange={(v) => void act(() => actions.setItemDone(task.id, item.id, v === true))}
                />
                <label
                  htmlFor={`${uid}-item-${index}`}
                  className={item.done ? "flex-1 break-words text-sm text-muted-foreground line-through" : "flex-1 break-words text-sm"}
                >
                  {item.text}
                </label>
                {p.canManageChecklist && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    aria-label={t("tasks.checklist.remove", { text: item.text })}
                    onClick={() => void act(() => actions.removeItem(task.id, item.id))}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {checklist.length === 0 && <p className="text-sm text-muted-foreground">{t("tasks.checklist.none")}</p>}
          {p.canManageChecklist && (
            <form
              className="flex items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!itemOk) return;
                if (await act(() => actions.addItem(task.id, newItem.trim()))) setNewItem("");
              }}
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor={`${uid}-newitem`}>{t("tasks.checklist.addLabel")}</Label>
                <Input id={`${uid}-newitem`} value={newItem} onChange={(e) => setNewItem(e.target.value)} />
              </div>
              <Button type="submit" size="sm" disabled={busy || !itemOk || checklist.length >= TASK_LIMITS.checklistItems}>
                {t("tasks.checklist.add")}
              </Button>
            </form>
          )}
        </section>

        {/* Comments (oldest first, newest at the bottom) */}
        <section aria-label={t("tasks.comments.heading")} className="space-y-2">
          <h3 className="text-sm font-semibold">{t("tasks.comments.heading")}</h3>
          {detail!.comments.length === 0 && <p className="text-sm text-muted-foreground">{t("tasks.comments.none")}</p>}
          <ul className="space-y-3">
            {detail!.comments.map((c) => (
              <li key={c.id} className="rounded-md bg-muted/40 p-2">
                <p className="text-xs text-muted-foreground">
                  {c.author.email} · {formatDateTime(c.createdAt, i18n.language)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.body}</p>
              </li>
            ))}
          </ul>
          {p.canComment && (
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentOk) return;
                if (await act(() => actions.addComment(task.id, comment.trim()), "tasks.toast.commented")) setComment("");
              }}
            >
              <Label htmlFor={`${uid}-comment`}>{t("tasks.comments.addLabel")}</Label>
              <Textarea id={`${uid}-comment`} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
              {comment.length > TASK_LIMITS.comment && (
                <p className="text-sm text-destructive">{t("tasks.validation.commentTooLong", { max: TASK_LIMITS.comment })}</p>
              )}
              <Button type="submit" size="sm" disabled={busy || !commentOk}>
                {t("tasks.comments.post")}
              </Button>
            </form>
          )}
        </section>

        {/* History: a thin neutral rail, oldest first */}
        <section aria-label={t("tasks.history.heading")} className="space-y-2">
          <h3 className="text-sm font-semibold">{t("tasks.history.heading")}</h3>
          <ol className="relative space-y-3 pl-5">
            <span aria-hidden="true" className="absolute bottom-1 left-1 top-1 w-px bg-border" />
            {detail!.events.map((ev) => (
              <li key={ev.id} className="relative text-sm">
                <span aria-hidden="true" className="absolute -left-[1.125rem] top-1.5 h-2 w-2 rounded-full bg-muted-foreground/60" />
                <p className="break-words">{describeTaskEvent(ev, t, i18n.language)}</p>
                {ev.type === "STATUS_CHANGED" && ev.note && (
                  <p className="break-words text-xs text-muted-foreground">{t("tasks.history.note", { note: ev.note })}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt, i18n.language)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-xl sm:p-6">
        {header}
        {body}
      </SheetContent>
    </Sheet>
  );
}
