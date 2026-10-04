import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Consistent section header: eyebrow, gradient title, supporting copy. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <Reveal className={`flex max-w-2xl flex-col gap-4 ${alignment} ${className}`}>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="text-3xl leading-tight font-bold sm:text-4xl">{title}</h2>
      {description ? <p className="text-base leading-relaxed text-fg-muted sm:text-lg">{description}</p> : null}
    </Reveal>
  );
}
