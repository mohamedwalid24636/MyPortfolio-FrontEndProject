/**
 * GitHub Pages answers a refresh on a client-side route with `404.html`, which stashes the
 * requested path and loads the real entry point. This module restores that path.
 *
 * It has to run before `createBrowserRouter` is called, not merely before the first render: the
 * router reads `window.location` once when it is constructed and then only reacts to `popstate`
 * events, and `history.replaceState` does not emit one. Restoring afterwards therefore left the
 * router pointing at `/index.html`, which matched no route and rendered "Page not found" on every
 * deep link while the site itself looked fine.
 *
 * It lives in its own module — and App.tsx imports it above everything else — so that import
 * evaluation order, not a human reading the file top to bottom, is what guarantees the ordering.
 */

const KEY = "gh-pages-path";

export function restoreGitHubPagesPath(): void {
  let stored: string | null = null;

  try {
    stored = sessionStorage.getItem(KEY);

    if (!stored) return;

    sessionStorage.removeItem(KEY);

    // Same URL already: nothing to do. Comparing without the hash keeps an in-page anchor from
    // being treated as a different path.
    if (stored.split("#")[0] === window.location.pathname + window.location.search) return;

    // `replace` keeps the intermediate /404.html out of the history stack.
    window.history.replaceState(null, "", stored);
  } catch {
    // Storage can be blocked, and replaceState can be rejected; the SPA still boots either way,
    // it just renders the route for index.html rather than the one that was requested.
  }
}

restoreGitHubPagesPath();