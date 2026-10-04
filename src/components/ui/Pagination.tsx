import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pageIndex: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Compact, accessible pager. Renders nothing when a single page is enough. */
export function Pagination({ pageIndex, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(pageIndex, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(pageIndex - 1)}
        disabled={pageIndex <= 1}
        aria-label="Previous page"
        className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-fg-muted transition hover:border-accent-500/40 hover:text-accent-200 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>

      {pages.map((page, index) =>
        page === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-fg-subtle" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === pageIndex ? "page" : undefined}
            aria-label={`Page ${page}`}
            className={`size-10 rounded-xl border text-sm font-medium transition ${
              page === pageIndex
                ? "border-accent-500/60 bg-accent-500/15 text-accent-100"
                : "border-white/10 text-fg-muted hover:border-accent-500/40 hover:text-accent-200"
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(pageIndex + 1)}
        disabled={pageIndex >= totalPages}
        aria-label="Next page"
        className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-fg-muted transition hover:border-accent-500/40 hover:text-accent-200 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  );
}

/** Always shows the first and last page, plus a window around the current page. */
function getVisiblePages(pageIndex: number, totalPages: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  const windowSize = 1;

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNear = Math.abs(page - pageIndex) <= windowSize;

    if (isEdge || isNear) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return pages;
}
