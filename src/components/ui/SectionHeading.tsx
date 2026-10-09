import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * Consistent section header.
 *
 * The title is deliberately one step below the page `h1` so a visitor always knows
 * which level of the hierarchy they are reading at.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <Reveal className={`flex max-w-2xl flex-col gap-3 ${alignment} ${className}`}>
      {eyebrow ? (
        <span className="inline-flex items-center gap-2.5">
          <span aria-hidden="true" className="h-px w-6 bg-accent-500/70" />
          <span className="eyebrow">{eyebrow}</span>
        </span>
      ) : null}
      <h2 className="text-2xl leading-snug font-bold sm:text-3xl">{title}</h2>
      {description ? <p className="text-base leading-relaxed text-fg-muted">{description}</p> : null}
    </Reveal>
  );
}
