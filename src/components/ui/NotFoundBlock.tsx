import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

interface NotFoundBlockProps {
  title: string;
  description: string;
  /** Show a "back to projects" shortcut in addition to home. */
  showProjectsLink?: boolean;
}

export function NotFoundBlock({ title, description, showProjectsLink = false }: NotFoundBlockProps) {
  return (
    <section className="section pt-40">
      <div className="container-page">
        <Reveal className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent-300">
            <Compass aria-hidden="true" className="size-7" />
          </span>
          <p className="mt-7 font-mono text-sm text-fg-subtle">404</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-fg-muted">{description}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="btn-primary">
              <Home aria-hidden="true" className="size-4" />
              Back to home
            </Link>
            {showProjectsLink ? (
              <Link to="/projects" className="btn-outline">
                Browse projects
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
