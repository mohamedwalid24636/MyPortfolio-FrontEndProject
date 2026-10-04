import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

/** Shown when the backend responds successfully but has no records yet. */
export function EmptyState({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] text-center ${
        compact ? "px-5 py-8" : "px-6 py-14"
      }`}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-fg-subtle">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      ) : null}
      <div className="space-y-1.5">
        <p className="font-semibold text-fg">{title}</p>
        {description ? <p className="mx-auto max-w-sm text-sm leading-relaxed text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
