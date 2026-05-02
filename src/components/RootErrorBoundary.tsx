import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";

const log = logger.child("RootErrorBoundary");

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error("Unhandled React error", {
      message: error.message,
      stack: error.stack ?? "",
      componentStack: info.componentStack ?? "",
    });
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background p-6 text-foreground">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit a runtime error. Check the browser console for details.
          </p>
          <pre className="mt-4 max-h-[50vh] overflow-auto rounded-md border border-border bg-muted p-4 text-xs">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
