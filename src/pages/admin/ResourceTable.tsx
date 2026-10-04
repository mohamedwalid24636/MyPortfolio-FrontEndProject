import { useEffect, useState } from "react";
import { Pencil, Search, Trash2, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Spinner } from "@/components/admin/FormFields";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationResult } from "@/types/api";
import type { ResourceSpec } from "@/pages/admin/adminConfig";

interface ResourceTableProps {
  spec: ResourceSpec<never>;
  page: PaginationResult<unknown> | null;
  isLoading: boolean;
  error: Error | null;
  onReload: () => void;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  onEdit: (dto: unknown) => void;
  onDelete: (dto: unknown) => void;
  onRowAction: (dto: unknown, changes: Record<string, unknown>) => void;
  busyRowId: number | null;
}

/**
 * Renders a spec's columns with server-side search and pagination, which is exactly what the API's
 * list endpoints provide. Row actions are per-row so a slow write never blocks the whole table.
 */
export function ResourceTable({
  spec,
  page,
  isLoading,
  error,
  onReload,
  onPageChange,
  onSearch,
  onEdit,
  onDelete,
  onRowAction,
  busyRowId,
}: ResourceTableProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  if (error) {
    return (
      <div className="surface p-6">
        <ErrorState
          title={`Could not load ${spec.plural.toLowerCase()}`}
          message={error.message}
          onRetry={onReload}
        />
      </div>
    );
  }

  if (isLoading && !page) {
    return (
      <div className="surface grid place-items-center p-16">
        <Spinner label={`Loading ${spec.plural.toLowerCase()}…`} />
      </div>
    );
  }

  const rows = page?.data ?? [];

  return (
    <div className="space-y-4">
      {spec.searchable !== false ? (
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={spec.searchPlaceholder ?? `Search ${spec.plural.toLowerCase()}…`}
            aria-label={`Search ${spec.plural.toLowerCase()}`}
            className="field !pl-10 !pr-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle transition hover:text-fg"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 && !isLoading ? (
        <div className="surface">
          <EmptyState
            title={debouncedSearch ? "No matches" : `No ${spec.plural.toLowerCase()} yet`}
            description={
              debouncedSearch
                ? "Nothing here matches that search. Try a different term."
                : (spec.emptyMessage ?? `Records you add here appear on the public site immediately.`)
            }
          />
        </div>
      ) : (
        <>
          <div className={`surface overflow-hidden transition ${isLoading ? "opacity-60" : "opacity-100"}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {spec.columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle ${
                          column.secondary ? "hidden lg:table-cell" : ""
                        }`}
                      >
                        {column.header}
                      </th>
                    ))}
                    <th scope="col" className="w-px whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((dto, index) => {
                    const safeDto = spec.normalize ? spec.normalize(dto as never) : dto;
                    const id = (safeDto as { id: number }).id;
                    const isBusy = busyRowId === id;

                    return (
                      <tr
                        key={id ?? index}
                        className={`border-b border-white/5 transition last:border-0 hover:bg-white/[0.02] ${
                          isBusy ? "opacity-50" : ""
                        }`}
                      >
                        {spec.columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-4 py-3 align-middle ${column.secondary ? "hidden lg:table-cell" : ""}`}
                          >
                            {column.render(safeDto as never)}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {spec.rowAction
                              ? spec.rowAction(dto as never, {
                                  update: (changes) => onRowAction(safeDto, changes),
                                  busy: isBusy,
                                })
                              : null}
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => onEdit(safeDto)}
                              disabled={isBusy}
                              aria-label={`Edit ${spec.singular.toLowerCase()}`}
                              title="Edit"
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                            </button>
                            {spec.supportsDelete !== false ? (
                              <button
                                type="button"
                                className="btn-icon-danger"
                                onClick={() => onDelete(safeDto)}
                                disabled={isBusy}
                                aria-label={`Delete ${spec.singular.toLowerCase()}`}
                                title="Delete"
                              >
                                <Trash2 aria-hidden="true" className="size-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {page && page.totalPages > 1 ? (
            <div className="pt-2">
              <Pagination pageIndex={page.pageIndex} totalPages={page.totalPages} onPageChange={onPageChange} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}