import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * A single "the backend changed" signal shared by the whole app.
 *
 * The database is the source of truth, so after any admin write every read path has to be able to
 * notice. Rather than threading refresh callbacks through the router, the admin calls
 * `invalidate()` once and both the public portfolio and the admin lists re-run their queries. That
 * is what makes an edit visible on the public site without a rebuild or a manual reload.
 */
interface DataVersionContextValue {
  /** Bumped on every successful mutation. Read paths use it as a query dependency. */
  version: number;
  /** Signals that at least one resource changed and dependent data should be refetched. */
  invalidate: () => void;
}

const DataVersionContext = createContext<DataVersionContextValue | null>(null);

export function DataVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  const invalidate = useCallback(() => setVersion((current) => current + 1), []);

  const value = useMemo<DataVersionContextValue>(() => ({ version, invalidate }), [version, invalidate]);

  return <DataVersionContext.Provider value={value}>{children}</DataVersionContext.Provider>;
}

export function useDataVersion(): DataVersionContextValue {
  const context = useContext(DataVersionContext);
  if (!context) {
    throw new Error("useDataVersion must be used within a <DataVersionProvider>.");
  }
  return context;
}