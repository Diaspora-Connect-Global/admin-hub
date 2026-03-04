import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariantClasses: Record<string, string> = {
  active: "border-transparent bg-green-600 text-white hover:bg-green-600/90 dark:bg-green-500 dark:text-white",
  warning: "border-transparent bg-amber-500 text-white hover:bg-amber-500/90 dark:bg-amber-500 dark:text-white",
  inactive: "border border-border bg-muted text-foreground hover:bg-muted/80 dark:bg-muted dark:text-foreground",
  error: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:text-white",
  pending: "border border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200 dark:border-amber-400 dark:bg-amber-500/20",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "active" | "warning" | "inactive" | "error" | "pending";
}

function StatusBadge({ className, variant = "inactive", ...props }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        statusVariantClasses[variant] ?? statusVariantClasses.inactive,
        className
      )}
      {...props}
    />
  );
}

export { StatusBadge };
