import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared loading / error / empty state views so every page surfaces async
 * status consistently. Use these instead of rendering nothing while `loading`,
 * or showing an empty list when a query actually failed.
 */

interface LoadingStateProps {
  /** Number of skeleton rows to render. */
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 5, className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-busy="true">
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/50 p-10 text-center", className)}
      role="alert"
    >
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div>
        <p className="font-medium text-foreground">{title ?? t("common.errorTitle")}</p>
        <p className="text-sm text-muted-foreground">{message ?? t("common.errorLoading")}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, message, icon, action, className }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 p-10 text-center", className)}
    >
      {icon ?? <Inbox className="h-10 w-10 text-muted-foreground" />}
      <div>
        <p className="font-medium text-foreground">{title ?? t("common.noData")}</p>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
      {action}
    </div>
  );
}
