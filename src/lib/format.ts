/** Presentation helpers. All are defensive: the API can return null/empty values. */

const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const FULL_DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const YEAR = new Intl.DateTimeFormat("en-GB", { year: "numeric" });

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** "Mar 2024" — returns null when the value is missing or unparsable. */
export function formatMonthYear(value: string | null | undefined): string | null {
  const date = toDate(value);
  return date ? MONTH_YEAR.format(date) : null;
}

/** "12 Mar 2024" — returns null when the value is missing or unparsable. */
export function formatFullDate(value: string | null | undefined): string | null {
  const date = toDate(value);
  return date ? FULL_DATE.format(date) : null;
}

export function formatYear(value: string | null | undefined): string | null {
  const date = toDate(value);
  return date ? YEAR.format(date) : null;
}

/**
 * "Mar 2024 — Present" / "Jan 2022 — Jun 2026"
 * Falls back to a year-only range when only a start date is present.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
): string {
  const from = formatMonthYear(start) ?? formatYear(start);
  const to = isCurrent ? "Present" : formatMonthYear(end) ?? formatYear(end);

  if (from && to) return `${from} — ${to}`;
  if (from) return from;
  if (to) return to;
  return "Date not specified";
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "•";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Rough fallback when the backend has no readingTime value. */
export function estimateReadingTime(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Splits a backend `description` field into clean bullet points. */
export function toBulletList(description: string | null | undefined): string[] {
  if (!description) return [];
  return description
    .split(/\r?\n|•|;/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 2);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
