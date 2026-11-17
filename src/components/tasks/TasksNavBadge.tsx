import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useMyTaskCounts } from "@/hooks/admin/useAdminTasks";

/**
 * Small count next to the "Tasks" nav entry. The visible digits are decorative;
 * the accessible text says what they mean ("3 open tasks, 1 overdue").
 */
export function TasksNavBadge({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const counts = useMyTaskCounts();
  if (!counts || counts.open <= 0) return null;

  const label =
    counts.overdue > 0
      ? t("tasks.badge.withOverdue", { open: t("tasks.badge.open", { count: counts.open }), overdue: t("tasks.badge.overdue", { count: counts.overdue }) })
      : t("tasks.badge.open", { count: counts.open });

  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
        counts.overdue > 0 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
        collapsed ? "absolute right-1 top-0" : "ml-auto",
      )}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{counts.open > 99 ? "99+" : counts.open}</span>
    </span>
  );
}
