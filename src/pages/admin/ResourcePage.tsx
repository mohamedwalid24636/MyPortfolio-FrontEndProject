import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAsync } from "@/hooks/useAsync";
import { isAbortError } from "@/lib/apiClient";
import { useDataVersion } from "@/context/DataVersionContext";
import { ConfirmDialog } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/ToastProvider";
import { ResourceFormModal } from "@/pages/admin/ResourceFormModal";
import { ResourceTable } from "@/pages/admin/ResourceTable";
import { buildInitialFiles, buildInitialValues, buildPayload, type Option, type ResourceSpec } from "@/pages/admin/adminConfig";

const PAGE_SIZE = 20;

interface ResourcePageProps {
  spec: ResourceSpec<never>;
}

type DialogState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; dto: unknown } | { mode: "delete"; dto: unknown };

/**
 * The generic admin page for one resource: list, search, paginate, create, edit, delete.
 *
 * After any successful write it calls `invalidate()`, which re-runs the public site's reads too —
 * so a change made here is visible on the portfolio without a reload.
 */
export function ResourcePage({ spec }: ResourcePageProps) {
  const { version, invalidate } = useDataVersion();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [relations, setRelations] = useState<Record<string, Option[]>>({});
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [busyRowId, setBusyRowId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: page, error, isLoading, reload } = useAsync(
    (signal) =>
      spec.service.list(
        {
          search: search.trim() || undefined,
          pageIndex,
          pageSize: PAGE_SIZE,
        },
        signal,
      ),
    [spec.service, search, pageIndex, version],
  );

  // Load the lookup lists this resource's form depends on (categories, tags, types, projects...).
  useEffect(() => {
    if (!spec.relations || spec.relations.length === 0) return;

    const controller = new AbortController();
    setRelationsLoading(true);

    Promise.all(spec.relations.map((relation) => relation.load(controller.signal)))
      .then((loaded) => {
        const next: Record<string, Option[]> = {};
        spec.relations?.forEach((relation, index) => {
          next[relation.key] = loaded[index] ?? [];
        });
        setRelations(next);
      })
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) {
          toast.error("Could not load the options for this form", "Some pickers may be empty.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRelationsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.relations, version]);

  const closeDialog = useCallback(() => setDialog({ mode: "closed" }), []);

  const handleSaved = useCallback(
    (message: string) => {
      closeDialog();
      toast.success(message);
      // Refresh the table and every public read path in one go.
      reload();
      invalidate();
    },
    [closeDialog, invalidate, reload, toast],
  );

  const confirmDelete = useCallback(async () => {
    if (dialog.mode !== "delete") return;

    const dto = dialog.dto;
    const id = (dto as { id: number }).id;
    setIsDeleting(true);
    setBusyRowId(id);

    try {
      await spec.service.remove(id);
      closeDialog();
      toast.success(`${spec.singular} deleted`);
      reload();
      invalidate();
    } catch (cause) {
      if (!isAbortError(cause)) {
        toast.error(`${spec.singular} could not be deleted`, cause instanceof Error ? cause.message : undefined);
      }
    } finally {
      setIsDeleting(false);
      setBusyRowId(null);
    }
  }, [closeDialog, dialog, invalidate, reload, spec, toast]);

  /** Per-row shortcut (e.g. "mark as read"): merges changes into the row and sends a normal PUT. */
  const handleRowAction = useCallback(
    (dto: unknown, changes: Record<string, unknown>) => {
      const id = (dto as { id: number }).id;
      const payload = buildPayload(
        spec,
        { ...buildInitialValues(spec, dto), ...changes },
        buildInitialFiles(spec, dto),
      );

      setBusyRowId(id);
      spec.service
        .update(id, payload)
        .then(() => {
          toast.success(`${spec.singular} updated`);
          reload();
          invalidate();
        })
        .catch((cause: unknown) => {
          if (!isAbortError(cause)) {
            toast.error(`${spec.singular} could not be updated`, cause instanceof Error ? cause.message : undefined);
          }
        })
        .finally(() => setBusyRowId(null));
    },
    [invalidate, reload, spec, toast],
  );

  const rowCount = page?.totalCount ?? 0;
  const showEmptyCta = spec.supportsCreate !== false && !isLoading && rowCount === 0 && !search;

  const headingMeta = useMemo(
    () => ({
      title: spec.plural,
      description: spec.description,
    }),
    [spec],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-fg sm:text-3xl">{headingMeta.title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">{headingMeta.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost !px-3" onClick={reload} disabled={isLoading} aria-label="Refresh">
            <RefreshCw aria-hidden="true" className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {spec.supportsCreate !== false ? (
            <button type="button" className="btn-primary" onClick={() => setDialog({ mode: "create" })}>
              <Plus aria-hidden="true" className="size-4" />
              New {spec.singular.toLowerCase()}
            </button>
          ) : null}
        </div>
      </header>

      {relationsLoading && spec.relations?.length ? (
        <p className="text-xs text-fg-subtle">Loading form options…</p>
      ) : null}

      <ResourceTable
        spec={spec}
        page={page}
        isLoading={isLoading}
        error={error}
        onReload={reload}
        onPageChange={setPageIndex}
        onSearch={(term) => {
          setSearch(term);
          setPageIndex(1);
        }}
        onEdit={(dto) => setDialog({ mode: "edit", dto })}
        onDelete={(dto) => setDialog({ mode: "delete", dto })}
        onRowAction={handleRowAction}
        busyRowId={busyRowId}
      />

      {showEmptyCta ? (
        <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm text-fg-muted">
            Nothing here yet. Add the first {spec.singular.toLowerCase()} to populate the site.
          </p>
          <button type="button" className="btn-outline" onClick={() => setDialog({ mode: "create" })}>
            <Plus aria-hidden="true" className="size-4" />
            New {spec.singular.toLowerCase()}
          </button>
        </div>
      ) : null}

      {spec.key === "profile" ? (
        <p className="flex items-center gap-2 text-xs text-fg-subtle">
          <Eye aria-hidden="true" className="size-3.5" />
          This record is visible on the <Link to="/" className="link">home page</Link>.
        </p>
      ) : null}

      {dialog.mode === "create" || dialog.mode === "edit" ? (
        <ResourceFormModal
          key={`${spec.key}-${dialog.mode}-${dialog.mode === "edit" ? (dialog.dto as { id: number }).id : "new"}`}
          spec={spec}
          dto={dialog.mode === "edit" ? dialog.dto : null}
          relations={relations}
          onClose={closeDialog}
          onSaved={handleSaved}
          onChanged={() => {
            reload();
            invalidate();
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={dialog.mode === "delete"}
        busy={isDeleting}
        title={`Delete this ${spec.singular.toLowerCase()}?`}
        confirmLabel="Delete permanently"
        message={
          <>
            <p>This removes the record from the database. Any file attached to it is deleted from the server too.</p>
            <p className="mt-3 rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 text-xs">
              There is no undo.
            </p>
          </>
        }
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}