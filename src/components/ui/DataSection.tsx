import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

interface DataSectionProps<T> {
  items: T[] | null | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  skeleton: ReactNode;
  empty: ReactNode;
  children: (items: T[]) => ReactNode;
  errorTitle?: string;
}

/**
 * Single place that decides what a data-driven section renders:
 * loading skeleton → error state → empty state → content.
 * Keeping this here stops the same three-way branch from being copy-pasted
 * into every section of the site.
 */
export function DataSection<T>({
  items,
  isLoading,
  error,
  onRetry,
  skeleton,
  empty,
  children,
  errorTitle,
}: DataSectionProps<T>) {
  if (isLoading) return <>{skeleton}</>;

  if (error) {
    return <ErrorState title={errorTitle} onRetry={onRetry} />;
  }

  if (!items || items.length === 0) {
    return <>{empty}</>;
  }

  return <>{children(items)}</>;
}

interface EmptyStateSpec {
  title: string;
  description?: string;
}

export function sectionEmptyState({ title, description }: EmptyStateSpec) {
  return <EmptyState title={title} description={description} compact />;
}
