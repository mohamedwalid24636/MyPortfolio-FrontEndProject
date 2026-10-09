import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HEADER_OFFSET = 96;
const MAX_ATTEMPTS = 240;
const STABLE_FRAMES = 10;
const MIN_FRAMES = 30;

/**
 * Resets scroll on navigation, but keeps in-page anchors working.
 *
 * Anchored targets are often rendered before the content around them settles (async API data,
 * late layout), so scrolling once lands short. While the document is still changing height we keep
 * the target aligned instantly on every animation frame; once the height holds steady for a few
 * frames we take the target there for real — smooth-scrolling on SPA navigation, and jumping on a
 * cold page load. React Router tags the first location with `key === "default"`, which identifies
 * the cold load reliably even though React StrictMode invokes effects twice on mount.
 */
export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const isColdLoad = key === "default";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let attempts = 0;
    let stableHeightFrames = 0;
    let lastHeight = -1;
    let cancelled = false;

    const target = () => document.querySelector(hash);

    const align = (behavior: ScrollBehavior) => {
      const el = target();
      if (!el) return false;
      const alignedTop = window.scrollY + el.getBoundingClientRect().top - HEADER_OFFSET;
      window.scrollTo({ top: alignedTop, left: 0, behavior });
      return true;
    };

    const tick = () => {
      if (cancelled) return;

      const height = document.documentElement.scrollHeight;
      if (height === lastHeight) stableHeightFrames += 1;
      else {
        lastHeight = height;
        stableHeightFrames = 0;
      }

      const settled = stableHeightFrames >= STABLE_FRAMES && attempts >= MIN_FRAMES;
      if (settled) {
        if (align(isColdLoad || reduced ? "auto" : "smooth")) return;
      } else {
        align("auto");
      }

      if (attempts < MAX_ATTEMPTS) {
        attempts += 1;
        frame = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname, hash, key]);

  return null;
}