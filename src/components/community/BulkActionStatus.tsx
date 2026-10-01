import { Progress } from "@/components/ui/progress";

export interface BulkFailure {
  /** The community's display name — never its id. */
  name: string;
  /** Admin-readable, id-free reason (see `displayErrorMessage`). */
  message: string;
}

interface BulkActionStatusProps {
  /** Items settled so far / total, while a run is in flight; null when idle. */
  progress: { done: number; total: number } | null;
  /** Already-translated "Doing… 2 of 5" line. */
  progressLabel: string;
  /** Items the last run could not act on. */
  failures: BulkFailure[];
  /** Already-translated summary shown above the failure list. */
  failureSummary: string;
}

/**
 * Progress and partial-failure reporting shared by the bulk community dialogs.
 * Progress is announced politely; failures are an alert, each naming the
 * community and the server's reason, so an admin knows exactly what to retry.
 */
export function BulkActionStatus({ progress, progressLabel, failures, failureSummary }: BulkActionStatusProps) {
  return (
    <>
      {progress && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm text-muted-foreground">{progressLabel}</p>
          <Progress
            value={progress.total ? Math.round((progress.done / progress.total) * 100) : 0}
            aria-label={progressLabel}
            className="h-2"
          />
        </div>
      )}
      {failures.length > 0 && (
        <div role="alert" className="space-y-1 rounded-md border border-destructive/40 p-3 text-sm">
          <p className="font-medium text-destructive">{failureSummary}</p>
          <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-5">
            {failures.map((failure, index) => (
              <li key={`${failure.name}-${index}`}>
                <span className="font-medium">{failure.name}</span>
                {" — "}
                <span className="text-muted-foreground">{failure.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
