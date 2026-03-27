import { Loader2 } from "lucide-react";

export function SessionHydrationFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background text-foreground"
      role="status"
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Loading session…</span>
    </div>
  );
}
