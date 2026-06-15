import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariantClasses: Record<string, string> = {
  active: "border-transparent bg-success text-success-foreground hover:bg-success/90",
  warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
  inactive: "border border-border bg-muted text-foreground hover:bg-muted/80",
  error: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
  pending: "border border-warning bg-warning/20 text-warning hover:bg-warning/30",
  info: "border-transparent bg-info text-info-foreground hover:bg-info/90",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "active" | "warning" | "inactive" | "error" | "pending" | "info";
}

export function StatusBadge({ className, variant = "inactive", ...props }: StatusBadgeProps) {
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
