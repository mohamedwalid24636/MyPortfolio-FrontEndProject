import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardRailProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  /** Accessible name for the rail; also used to label the prev/next controls. */
  label: string;
  /** Slide width on multi-item rails. A single item always fills the row. */
  slideClassName?: string;
  className?: string;
}

/**
 * Compact horizontal rail for resume-style cards.
 *
 * One implementation covers Education, Experience, Certifications, Achievements and Projects so
 * every section scrolls, snaps and signals overflow the same way: a touch-friendly snap-scroll
 * track, edge fades when more cards sit off-screen, and prev/next controls with dots (or a
 * counter for longer lists). A rail with one card drops the controls entirely, and an empty rail
 * renders nothing.
 */
export function CardRail<T>({
  items,
  getKey,
  renderItem,
  label,
  slideClassName = "w-[85%] sm:w-80",
  className = "",
}: CardRailProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [edges, setEdges] = useState({ overflows: false, start: true, end: true });
  const count = items.length;
  const single = count === 1;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const overflows = track.scrollWidth - track.clientWidth > 1;
    const start = track.scrollLeft <= 1;
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    setEdges((previous) =>
      previous.overflows === overflows && previous.start === start && previous.end === end
        ? previous
        : { overflows, start, end },
    );
  }, []);

  const scrollToIndex = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(count - 1, target));
      const slide = track.children[clamped] as HTMLElement | undefined;
      if (!slide) return;
      const offset =
        slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      track.scrollTo({ left: offset, behavior: "smooth" });
      setIndex(clamped);
    },
    [count],
  );

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();

    const trackLeft = track.getBoundingClientRect().left;
    let nearest = 0;
    let smallest = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((child, position) => {
      const distance = Math.abs((child as HTMLElement).getBoundingClientRect().left - trackLeft);
      if (distance < smallest) {
        smallest = distance;
        nearest = position;
      }
    });
    setIndex((previous) => (previous === nearest ? previous : nearest));
  }, [measure]);

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
  }, [measure, count]);

  useEffect(() => {
    if (count > 0) scrollToIndex(0);
  }, [count, scrollToIndex]);

  if (count === 0) return null;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${label}, ${count} ${single ? "item" : "items"}`}
          tabIndex={edges.overflows ? 0 : -1}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 focus-visible:-outline-offset-2"
        >
          {items.map((item, position) => (
            <div
              key={getKey(item, position)}
              className={`flex shrink-0 snap-start ${single ? "w-full" : slideClassName}`}
            >
              {renderItem(item, position)}
            </div>
          ))}
        </div>

        {edges.overflows ? (
          <>
            {!edges.start ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink-950 to-transparent"
              />
            ) : null}
            {!edges.end ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink-950 to-transparent"
              />
            ) : null}
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToIndex(index - 1)}
            disabled={index === 0}
            aria-label={`Previous ${label}`}
            className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-fg-muted transition hover:border-accent-400/60 hover:text-fg disabled:opacity-30"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          {count <= 8 ? (
            <div className="flex items-center gap-1.5">
              {items.map((item, position) => (
                <button
                  key={getKey(item, position)}
                  type="button"
                  onClick={() => scrollToIndex(position)}
                  aria-label={`Go to ${label} ${position + 1}`}
                  aria-current={position === index}
                  className={`size-2 rounded-full transition ${
                    position === index ? "bg-accent-300" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="text-xs font-medium text-fg-subtle">
              {index + 1} / {count}
            </span>
          )}

          <button
            type="button"
            onClick={() => scrollToIndex(index + 1)}
            disabled={index === count - 1}
            aria-label={`Next ${label}`}
            className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-fg-muted transition hover:border-accent-400/60 hover:text-fg disabled:opacity-30"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
