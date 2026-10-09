import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ScrollRowProps {
  children: ReactNode;
  className?: string;
  /** Render the track as a `<div>` (default) or a semantic `<ul>`. */
  as?: "div" | "ul";
  /**
   * Tailwind colour token the edge fades blend into — it has to match whatever surface the row
   * sits on, otherwise the fade reads as a floating rectangle. Defaults to the page background.
   */
  fadeFrom?: string;
  /** Turn the edge fades off when the row sits on a translucent surface where they would not blend. */
  fade?: boolean;
  /** Accessible name for the scrollable region, announced only while it actually scrolls. */
  label?: string;
}

/**
 * A single row of chips that scrolls horizontally on small screens and wraps normally from the
 * `sm` breakpoint up.
 *
 * On mobile the row bleeds past the container padding so the last chip can sit flush with the
 * screen edge, and soft gradients hint that there is more to the sides. The whole region is only
 * made focusable while it genuinely overflows, so a row that happens to fit stays out of the tab
 * order.
 */
export function ScrollRow({
  children,
  className = "",
  as = "div",
  fadeFrom = "from-ink-950",
  fade = true,
  label,
}: ScrollRowProps) {
  const trackRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState({ overflows: false, atStart: true, atEnd: true });

  const setTrackRef = useCallback((node: HTMLElement | null) => {
    trackRef.current = node;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const overflows = track.scrollWidth - track.clientWidth > 1;
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;

    setState((previous) =>
      previous.overflows === overflows && previous.atStart === atStart && previous.atEnd === atEnd
        ? previous
        : { overflows, atStart, atEnd },
    );
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);

    const track = trackRef.current;
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (track && observer) observer.observe(track);

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [measure]);

  const Track = as;

  return (
    <div className="relative -mx-4 sm:mx-0">
      <Track
        ref={setTrackRef}
        onScroll={measure}
        tabIndex={state.overflows ? 0 : -1}
        aria-label={state.overflows ? label : undefined}
        className={`flex gap-2 overflow-x-auto px-4 py-1.5 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-0 ${className}`}
      >
        {children}
      </Track>

      {fade && state.overflows ? (
        <>
          {!state.atStart ? (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r ${fadeFrom} to-transparent sm:hidden`}
            />
          ) : null}
          {!state.atEnd ? (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l ${fadeFrom} to-transparent sm:hidden`}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
