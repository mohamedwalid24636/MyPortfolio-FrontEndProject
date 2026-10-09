import { Link } from "react-router-dom";
import { ChevronRight, House } from "lucide-react";

export interface Crumb {
  label: string;
  /** Omit on the last entry — it is the current page. */
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

/**
 * Contextual trail for inner pages, so a visitor always has a one-click way back to
 * the section they came from instead of relying on the browser back button.
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <li className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-fg-subtle transition hover:text-accent-200"
          >
            <House aria-hidden="true" className="size-3.5" />
            Home
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5 text-fg-subtle/60" />
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.to && !isLast ? (
                <>
                  <Link to={item.to} className="text-fg-subtle transition hover:text-accent-200">
                    {item.label}
                  </Link>
                  <ChevronRight aria-hidden="true" className="size-3.5 text-fg-subtle/60" />
                </>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-fg-muted">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
