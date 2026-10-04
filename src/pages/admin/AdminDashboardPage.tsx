import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Database } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/context/DataVersionContext";
import { Spinner } from "@/components/admin/FormFields";
import { ErrorState } from "@/components/ui/ErrorState";
import { RESOURCE_SPECS, type ResourceSpec } from "@/pages/admin/adminConfig";

interface CountsResult {
  counts: Record<string, number>;
  /** Resources whose count could not be read, so a single bad endpoint cannot blank the page. */
  failures: string[];
}

/** Counts every resource in one pass so the dashboard reflects real database state. */
async function loadCounts(signal: AbortSignal): Promise<CountsResult> {
  const results = await Promise.all(
    RESOURCE_SPECS.map(async (spec): Promise<[string, number] | null> => {
      try {
        const result = await spec.service.list({ pageSize: 1 }, signal);
        return [spec.key, result?.totalCount ?? 0];
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        return null;
      }
    }),
  );

  const counts: Record<string, number> = {};
  const failures: string[] = [];

  results.forEach((result, index) => {
    if (result === null) failures.push(RESOURCE_SPECS[index].plural.toLowerCase());
    else counts[result[0]] = result[1];
  });

  return { counts, failures };
}

/** The content the site is missing, plus anything that failed to count. */
function buildAttention(counts: Record<string, number>, failures: string[]): string[] {
  const notes: string[] = [];

  if ((counts.messages ?? 0) === 0) {
    notes.push("No contact messages yet — messages sent from the public form will land here.");
  }
  if ((counts.resumes ?? 0) === 0) {
    notes.push("No resume uploaded, so the download button on the resume page has nothing to serve.");
  }
  if ((counts.blog ?? 0) === 0) {
    notes.push("No blog posts — the blog index is currently empty.");
  }
  if ((counts.projects ?? 0) > 0 && (counts.projectImages ?? 0) === 0) {
    notes.push("Projects have no gallery images; detail pages will show the cover only.");
  }
  for (const failure of failures) {
    notes.push(`Could not read ${failure}.`);
  }

  return notes;
}

export function AdminDashboardPage() {
  const { version } = useDataVersion();
  const { data, error, isLoading, reload } = useAsync(loadCounts, [version]);

  const counts = data?.counts ?? {};
  const attention = data ? buildAttention(data.counts, data.failures) : [];

  const missing = RESOURCE_SPECS.filter((spec) => counts[spec.key] === 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-fg sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Every value below is read from the API. Writes go straight to the database, and the public site
          refreshes as soon as a change is saved.
        </p>
      </header>

      {error ? (
        <div className="surface p-6">
          <ErrorState title="Could not reach the API" message={error.message} onRetry={reload} />
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="surface grid place-items-center p-16">
          <Spinner label="Reading the database…" />
        </div>
      ) : null}

      {data ? (
        <>
          <section aria-labelledby="counts-heading">
            <h2 id="counts-heading" className="sr-only">
              Record counts
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {RESOURCE_SPECS.map((spec) => (
                <li key={spec.key}>
                  <Link
                    to={`/admin/${spec.key}`}
                    className="card card-hover group flex h-full flex-col justify-between gap-4 p-4"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                      {spec.plural}
                    </span>
                    <span className="flex items-end justify-between gap-2">
                      <span className="font-display text-3xl font-bold text-fg tabular-nums">
                        {counts[spec.key] ?? 0}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-accent-300"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {attention.length > 0 ? (
            <section aria-labelledby="attention-heading" className="surface p-5">
              <h2 id="attention-heading" className="flex items-center gap-2 font-display text-sm font-semibold text-fg">
                <AlertCircle aria-hidden="true" className="size-4 text-amber-300" />
                Worth a look
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                {attention.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-300/70" />
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {missing.length > 0 ? (
            <section aria-labelledby="empty-heading" className="surface p-5">
              <h2 id="empty-heading" className="flex items-center gap-2 font-display text-sm font-semibold text-fg">
                <Database aria-hidden="true" className="size-4 text-accent-300" />
                Empty tables
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                These sections have no rows yet. The corresponding part of the site renders empty until you add some.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {missing.map((spec) => (
                  <li key={spec.key}>
                    <Link to={`/admin/${spec.key}`} className="chip hover:border-accent-500/40 hover:text-accent-200">
                      {spec.plural}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** Resolves the spec behind an /admin/:resource route segment. */
export function pickSpec(key: string | undefined): ResourceSpec<never> | undefined {
  return RESOURCE_SPECS.find((spec) => spec.key === key);
}