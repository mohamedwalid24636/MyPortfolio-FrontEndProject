import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RotateCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Last line of defence: if a component throws while rendering, the visitor gets
 * a recoverable page instead of a blank screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled UI error:", error, errorInfo.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="card max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
            <AlertOctagon aria-hidden="true" className="size-6" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            An unexpected error occurred while rendering this page. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary mt-6"
          >
            <RotateCw aria-hidden="true" className="size-4" />
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
