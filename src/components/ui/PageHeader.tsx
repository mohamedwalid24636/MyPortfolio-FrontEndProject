import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Shared hero header used by every inner page. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-white/8 pb-14 pt-32 sm:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_70%_at_50%_0%,#000,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />

      <div className="container-page">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{description}</p>
          ) : null}
          {actions ? <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div> : null}
        </Reveal>
      </div>
    </header>
  );
}
