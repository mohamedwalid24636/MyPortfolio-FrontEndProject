import { SmartImage } from "@/components/ui/SmartImage";
import { isVideoUrl, resolveImageUrl } from "@/lib/media";

interface SmartMediaProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
  sizes?: string;
}

/**
 * Renders a stored attachment with the element that can actually decode it.
 *
 * Project galleries hold screenshots and screen recordings in the same record, so this renders a
 * `<video>` for a video URL and delegates everything else to `SmartImage`.
 *
 * `preload="none"` is deliberate: a walkthrough is tens to hundreds of megabytes and the page must
 * not pull it over the wire for a visitor who never presses play. `eager` still only asks for
 * metadata (duration, dimensions, poster frame), never the media bytes.
 */
export function SmartMedia({ src, alt, className, eager = false, sizes }: SmartMediaProps) {
  if (!isVideoUrl(src)) {
    return <SmartImage src={src} alt={alt} className={className} eager={eager} sizes={sizes} />;
  }

  return (
    <video
      src={resolveImageUrl(src)}
      controls
      playsInline
      preload={eager ? "metadata" : "none"}
      className={className}
      aria-label={alt}
    />
  );
}