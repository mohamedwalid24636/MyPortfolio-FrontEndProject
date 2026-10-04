import { useEffect, useState } from "react";
import { FALLBACK_IMAGE } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/media";

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
  /** Hint the browser when the image is not a simple full-width asset. */
  sizes?: string;
}

/**
 * An <img> that always renders something meaningful:
 *  - resolves API paths against the frontend origin
 *  - falls back to a generated placeholder when the URL is missing or fails to load
 *  - lazy by default to keep the initial payload light
 */
export function SmartImage({ src, alt, className, eager = false, sizes }: SmartImageProps) {
  const resolved = resolveImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolved);
  }, [resolved]);

  const hasFailed = currentSrc === FALLBACK_IMAGE;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onError={() => {
        if (!hasFailed) setCurrentSrc(FALLBACK_IMAGE);
      }}
    />
  );
}
