import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { SmartMedia } from "@/components/ui/SmartMedia";
import { isVideoUrl } from "@/lib/media";

export interface MediaCarouselItem {
  id: number | string;
  url: string;
  caption?: string;
}

interface MediaCarouselProps {
  items: MediaCarouselItem[];
  /** Used to build accessible labels for each slide. */
  title: string;
  className?: string;
}

/** How long the gallery rests on a slide before advancing on its own. */
const AUTOPLAY_INTERVAL = 4500;

/** Tracks the visitor's motion preference so autoplay stays off unless they opt in. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduced(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}

/**
 * A gallery slide that renders a `<video>` with a centred play affordance.
 *
 * The media events (`play`/`pause`/`ended`) do not bubble, so they are wired to the actual
 * `<video>` element through a ref rather than to this wrapper. The overlay is a compact centred
 * button instead of a full-bleed scrim so the native controls underneath stay reachable while
 * paused.
 */
function CarouselVideo({ src, label }: { src: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = wrapRef.current?.querySelector("video");
    if (!video) return;

    const handlePlay = () => setPlaying(true);
    const handleStop = () => setPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handleStop);
    video.addEventListener("ended", handleStop);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handleStop);
      video.removeEventListener("ended", handleStop);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative size-full">
      <SmartMedia src={src} alt={label} className="size-full object-contain" />
      <button
        type="button"
        onClick={() => {
          void wrapRef.current?.querySelector("video")?.play();
        }}
        aria-label={`Play ${label}`}
        className={`absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink-950/70 text-fg backdrop-blur transition duration-200 hover:scale-105 ${
          playing ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <Play aria-hidden="true" className="size-7 translate-x-0.5" />
      </button>
    </div>
  );
}

/**
 * Unified media viewer for a project.
 *
 * A project's cover, screenshots and screen recordings live in separate API fields, so the caller
 * flattens them into one ordered `items` array. Each slide snap-scrolls full width; arrows, a
 * counter and (for short galleries) dots give every input method a way to move through it.
 *
 * The gallery also advances on its own every few seconds. Autoplay is a courtesy, never a trap:
 * it is off by default when the visitor prefers reduced motion, it stops while the tab is hidden,
 * a visible control can pause it, and it yields to a visitor who is watching a video — the timer
 * only resumes once that video ends or the visitor resumes the slideshow explicitly.
 */
export function MediaCarousel({ items, title, className = "" }: MediaCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const count = items.length;

  const prefersReducedMotion = usePrefersReducedMotion();
  const [autoPlay, setAutoPlay] = useState(!prefersReducedMotion);
  const [videoEngaged, setVideoEngaged] = useState(false);
  const [tabHidden, setTabHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );

  const pauseAllVideos = useCallback(() => {
    trackRef.current?.querySelectorAll("video").forEach((video) => video.pause());
  }, []);

  const scrollToSlide = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track || count === 0) return;
      const clamped = ((target % count) + count) % count;
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
    if (!track || count === 0) return;
    const next = Math.max(0, Math.min(count - 1, Math.round(track.scrollLeft / track.clientWidth)));
    setIndex((previous) => (previous === next ? previous : next));
  }, [count]);

  // Media events do not bubble, but they do travel the capture phase — so a listener on the track
  // still sees every `<video>` inside it. Playing pauses autoplay; the video ending releases it.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handlePlay = () => setVideoEngaged(true);
    const handleEnded = () => setVideoEngaged(false);
    track.addEventListener("play", handlePlay, true);
    track.addEventListener("ended", handleEnded, true);
    return () => {
      track.removeEventListener("play", handlePlay, true);
      track.removeEventListener("ended", handleEnded, true);
    };
  }, [count]);

  // A new active slide is a fresh start: the previous video is no longer the visitor's focus.
  useEffect(() => {
    setVideoEngaged(false);
  }, [index]);

  useEffect(() => {
    const handleVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const autoplayActive = autoPlay && !videoEngaged && !tabHidden && count > 1;

  useEffect(() => {
    if (!autoplayActive) return;
    const id = window.setTimeout(() => {
      pauseAllVideos();
      scrollToSlide(index + 1);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearTimeout(id);
  }, [autoplayActive, index, scrollToSlide, pauseAllVideos]);

  const handleToggleAutoplay = () => {
    if (autoplayActive) {
      setAutoPlay(false);
      return;
    }
    setAutoPlay(true);
    setVideoEngaged(false);
    pauseAllVideos();
  };

  const active = items[index] ?? items[0];

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-850 shadow-card">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title} media gallery`}
          tabIndex={0}
          className="flex snap-x snap-mandatory overflow-x-auto focus-visible:-outline-offset-2"
        >
          {items.map((item, position) => {
            const label = item.caption || `${title} media ${position + 1}`;
            return (
              <figure
                key={item.id}
                className="relative aspect-[16/10] w-full shrink-0 snap-center bg-ink-900 sm:aspect-[16/9]"
              >
                {isVideoUrl(item.url) ? (
                  <CarouselVideo src={item.url} label={label} />
                ) : (
                  <SmartImage
                    src={item.url}
                    alt={label}
                    eager={position === 0}
                    className="size-full object-contain"
                  />
                )}
              </figure>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={handleToggleAutoplay}
              aria-label={autoplayActive ? "Pause automatic slideshow" : "Resume automatic slideshow"}
              aria-pressed={autoplayActive}
              className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-white/15 bg-ink-950/70 text-fg backdrop-blur transition hover:bg-ink-950/90"
            >
              {autoplayActive ? (
                <Pause aria-hidden="true" className="size-4" />
              ) : (
                <Play aria-hidden="true" className="size-4 translate-x-px" />
              )}
            </button>

            <button
              type="button"
              onClick={() => scrollToSlide(index - 1)}
              disabled={index === 0}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-950/70 text-fg backdrop-blur transition hover:bg-ink-950/90 disabled:opacity-30"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSlide(index + 1)}
              disabled={index === count - 1}
              aria-label="Next media"
              className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-950/70 text-fg backdrop-blur transition hover:bg-ink-950/90 disabled:opacity-30"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
            <span className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-ink-950/70 px-2.5 py-1 text-xs font-medium text-fg backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {count >= 2 && count <= 8 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((item, position) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSlide(position)}
              aria-label={`Go to media ${position + 1}`}
              aria-current={position === index}
              className={`size-2 rounded-full transition ${
                position === index ? "bg-accent-300" : "bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      ) : null}

      {active?.caption ? (
        <p className="mt-3 text-center text-sm leading-relaxed text-fg-muted">{active.caption}</p>
      ) : null}
    </div>
  );
}
