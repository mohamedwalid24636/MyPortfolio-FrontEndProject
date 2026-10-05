import { FALLBACK_IMAGE } from "@/lib/constants";

/**
 * Origin every backend-hosted file is fetched from.
 *
 * The API hands out attachment URLs as `<Urls:BaseUrl>/Files/<path>`. That value is scheme-less
 * ("mohamedwalid.runasp.net/Files/..."), which a browser would resolve against the *frontend's*
 * origin and 404 on GitHub Pages. Everything the backend serves — images, the CV, certificates —
 * is therefore resolved against this origin explicitly rather than against `location.origin`.
 */
const BACKEND_ORIGIN = (
  import.meta.env.VITE_ASSET_ORIGIN ??
  (() => {
    try {
      return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin;
    } catch {
      return "";
    }
  })()
).replace(/\/+$/, "");

/** Files the app itself ships in `public/`, which live under the Vite base path on Pages. */
const APP_BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

const DOTTED_HOST = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?::\d+)?$/i;
const HOST_WITH_PORT = /^[a-z0-9-]+(?::\d+)?$/i;

/**
 * True for the scheme-less absolute URLs the backend emits, e.g.
 * `mohamedwalid.runasp.net/Files/images/profile/x.jpg`.
 *
 * The path separator is what separates a host from a plain file name: `graduation.jpg` also looks
 * like a dotted token, but with no `/` after it there is no host to prepend a scheme to, and
 * turning it into `https://graduation.jpg` would be worse than leaving it alone.
 */
function isSchemeLessHost(value: string): boolean {
  const slash = value.indexOf("/");
  if (slash <= 0) return false;

  const host = value.slice(0, slash);
  return DOTTED_HOST.test(host) || (host.includes(":") && HOST_WITH_PORT.test(host));
}

/**
 * Normalises a file URL coming from the API.
 *
 * - absolute `http(s)://` and `data:` URLs are returned untouched
 * - protocol-relative `//host/...` is pinned to https
 * - scheme-less hosts (`mohamedwalid.runasp.net/Files/...`) get `https://` prepended, because that
 *   is the shape the backend actually emits
 * - root-relative paths (`/Files/...`) are resolved against the backend origin
 * - anything else is treated as an app-bundled asset under the Vite base path
 * - empty / invalid values fall back to a generated placeholder
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (typeof url !== "string" || url.trim().length === 0) return FALLBACK_IMAGE;

  const value = url.trim();

  if (/^data:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;

  // A scheme-less "host.tld/path" from the backend is really an absolute URL missing its scheme.
  if (isSchemeLessHost(value)) return `https://${value}`;

  // Root-relative means "on the backend", never "on the frontend".
  if (value.startsWith("/")) {
    return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${value}` : value;
  }

  return `${APP_BASE}/${value}`;
}

/** Resolves a downloadable document, falling back to a bundled copy when absent. */
export function resolveFileUrl(url: string | null | undefined, fallback: string): string {
  if (typeof url !== "string" || url.trim().length === 0) return fallback;
  return resolveImageUrl(url);
}

/** True when the backend provided a usable link we can render as an anchor. */
export function hasLink(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}