import { memo } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CalendarDays, CheckSquare, MessageSquare, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate, type AdminTask, type AdminTaskPriority, type AdminTaskStatus } from "@/lib/adminTasks";

/** Status as TEXT (never colour alone), with a neutral/tinted badge. */
export function TaskStatusBadge({ status }: { status: AdminTaskStatus }) {
  const { t } = useTranslation();
  const variant = status === "BLOCKED" ? "destructive" : status === "DONE" ? "default" : "secondary";
  return <Badge variant={variant}>{t(`tasks.status.${status}`)}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: AdminTaskPriority }) {
  const { t } = useTranslation();
  const variant = priority === "URGENT" ? "destructive" : priority === "LOW" ? "outline" : "secondary";
  return <Badge variant={variant}>{t(`tasks.priority.${priority}`)}</Badge>;
}

/** Due date; an overdue task gets an icon + the word "Overdue" + a tinted background. */
export function TaskDue({ task }: { task: Pick<AdminTask, "dueAt" | "overdue"> }) {
  const { t, i18n } = useTranslation();
  if (!task.dueAt) {
    return <span className="text-xs text-muted-foreground">{t("tasks.card.noDue")}</span>;
  }
  const date = formatDate(task.dueAt, i18n.language);
  if (task.overdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        {t("tasks.card.overdue")} · {date}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
      {t("tasks.card.due", { date })}
    </span>
  );
}

interface TaskCardProps {
  task: AdminTask;
  onOpen: (taskId: string) => void;
  showStatus?: boolean;
}

/** A task as a card/row. The whole card is one button that opens the drawer. */
export const TaskCard = memo(function TaskCard({ task, onOpen, showStatus = false }: TaskCardProps) {
  const { t } = useTranslation();
  const done = task.status === "DONE" || task.status === "CANCELLED";
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 text-left transition-colors",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        task.overdue && !done && "bg-destructive/5",
      )}
    >
      <span className={cn("block break-words text-sm font-medium text-foreground", done && "text-muted-foreground")}>
        {task.title}
      </span>
      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t("tasks.card.assignee")}: </span>
        <span className="truncate">{task.assignee.email}</span>
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-2">
        {showStatus && <TaskStatusBadge status={task.status} />}
        <TaskPriorityBadge priority={task.priority} />
        {!done && <TaskDue task={task} />}
      </span>
      {(task.checklistTotal > 0 || task.commentCount > 0) && (
        <span className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {task.checklistTotal > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">{t("tasks.checklist.heading")}: </span>
              {task.checklistDone}/{task.checklistTotal}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {t("tasks.card.comments", { count: task.commentCount })}
            </span>
          )}
        </span>
      )}
    </button>
  );
});
