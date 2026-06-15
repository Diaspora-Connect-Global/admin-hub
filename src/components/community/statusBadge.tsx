export const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Active": "badge-status badge-success",
    "Inactive": "badge-status badge-warning",
    "Suspended": "badge-status badge-destructive",
    "Approved": "badge-status badge-success",
    "Pending": "badge-status badge-warning",
    "Open": "badge-status badge-info",
    "Scheduled": "badge-status badge-info",
    "Completed": "badge-status badge-success",
  };
  return <span className={styles[status] || "badge-status badge-muted"}>{status}</span>;
};
