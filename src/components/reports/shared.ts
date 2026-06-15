export const statusConfig: Record<string, { label: string; className: string }> = {
  // Escrow statuses
  PENDING: { label: "Pending", className: "bg-warning/20 text-warning border-warning/30" },
  HELD: { label: "Held", className: "bg-primary/20 text-primary border-primary/30" },
  RELEASED: { label: "Released", className: "bg-success/20 text-success border-success/30" },
  REFUNDED: { label: "Refunded", className: "bg-muted text-muted-foreground border-border" },
  FROZEN: { label: "Frozen", className: "bg-destructive/20 text-destructive border-destructive/30" },
  DISPUTED: { label: "Disputed", className: "bg-destructive/20 text-destructive border-destructive/30" },
  // Dispute statuses
  OPEN: { label: "Open", className: "bg-primary/20 text-primary border-primary/30" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-warning/20 text-warning border-warning/30" },
  RESOLVED: { label: "Resolved", className: "bg-success/20 text-success border-success/30" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
  ESCALATED: { label: "Escalated", className: "bg-destructive/20 text-destructive border-destructive/30" },
  // Service health
  healthy: { label: "Healthy", className: "bg-success/20 text-success border-success/30" },
  down: { label: "Down", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export function formatAmount(amount: number, currency?: string) {
  return `${currency ?? "USD"} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function truncateId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
