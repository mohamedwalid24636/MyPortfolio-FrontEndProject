import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
}

/** Shared hero header used by every inner page. */
export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 pb-10 pt-24 sm:pb-12 sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_70%_at_50%_0%,#000,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />

      <div className="container-page">
        <Reveal className="max-w-3xl">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <Breadcrumbs items={breadcrumbs} className="mb-5" />
          ) : null}
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-4 font-display text-3xl leading-[1.1] font-bold sm:text-4xl lg:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{description}</p>
          ) : null}
          {actions ? <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div> : null}
        </Reveal>
      </div>
    </header>
  );
}
