import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/index.css";

/**
 * GitHub Pages answers any unknown path with `404.html`, which stashes the requested path and
 * reloads this entry point. Restoring it here is what makes a refresh on a deep link work; the
 * `replace` keeps the intermediate /404.html out of the history stack.
 */
function restoreGitHubPagesPath(): void {
  const KEY = "gh-pages-path";

  try {
    const stored = sessionStorage.getItem(KEY);
    if (!stored) return;
    sessionStorage.removeItem(KEY);
    if (stored === window.location.pathname + window.location.search) return;

    window.history.replaceState(null, "", stored);
  } catch {
    // Storage can be blocked; the SPA still boots, only the URL is not restored.
  }
}

restoreGitHubPagesPath();

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root container "#root" was not found in index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
