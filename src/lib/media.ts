import { FALLBACK_IMAGE } from "@/lib/constants";

/**
 * Normalises an image URL coming from the API.
 * - absolute URLs (http/https) are returned untouched
 * - root-relative or relative paths are resolved against the frontend origin so
 *   that assets shipped in `public/` (the CV, profile photos) resolve correctly
 * - empty / invalid values fall back to a generated placeholder
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (typeof url !== "string" || url.trim().length === 0) return FALLBACK_IMAGE;

  const value = url.trim();
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/")) return value;

  return `/${value}`;
}

/** Resolves a downloadable document, falling back to the bundled CV when absent. */
export function resolveFileUrl(url: string | null | undefined, fallback: string): string {
  if (typeof url !== "string" || url.trim().length === 0) return fallback;
  return resolveImageUrl(url);
}

/** True when the backend provided a usable link we can render as an anchor. */
export function hasLink(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}
