import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Chip } from "@/components/ui/Chip";
import { SmartImage } from "@/components/ui/SmartImage";
import { hasLink } from "@/lib/media";
import type { ProjectDto } from "@/types/api";

const MAX_VISIBLE_TAGS = 3;

interface ProjectCardProps {
  project: ProjectDto;
}

/**
 * Scannable summary of a project. Everything a visitor needs to decide whether to open it
 * (name, one-line pitch, category, stack, status) — the full case study lives on the detail page.
 *
 * The title is a stretched link, so the whole card is one tab stop instead of three.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const technologies = project.technologies ?? [];
  const categories = project.categories ?? [];
  const visibleTechnologies = technologies.slice(0, MAX_VISIBLE_TAGS);
  const remaining = technologies.length - visibleTechnologies.length;
  const year = project.startDate ? new Date(project.startDate).getFullYear() : null;

  return (
    <article className="card card-hover group flex h-full flex-row sm:flex-col">
      <div className="relative w-24 shrink-0 overflow-hidden border-r border-white/8 bg-ink-800 sm:aspect-[16/10] sm:w-full sm:border-r-0 sm:border-b">
        <SmartImage
          src={project.imageUrl}
          alt=""
          eager={false}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent sm:block" />

        <div className="absolute inset-x-4 top-4 hidden flex-wrap items-center gap-2 sm:flex">
          {project.status ? <Chip variant="accent">{project.status}</Chip> : null}
          {project.featured ? (
            <Chip>
              <Star aria-hidden="true" className="size-3 text-amber-300" />
              Featured
            </Chip>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:gap-3 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] uppercase tracking-wider text-fg-subtle">
            {categories.length > 0 ? <span>{categories[0].name}</span> : null}
            {year ? <span>{year}</span> : null}
          </div>
          {project.status ? (
            <Chip variant="accent" className="sm:hidden">
              {project.status}
            </Chip>
          ) : null}
        </div>

        <h3 className="font-display text-base leading-snug font-semibold text-fg sm:text-lg">
          <Link
            to={`/projects/${project.id}`}
            className="transition after:absolute after:inset-0 group-hover:text-accent-200"
          >
            {project.title}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted sm:line-clamp-3">
          {project.shortDescription || project.description}
        </p>

        {technologies.length > 0 ? (
          <ul className="mt-0.5 flex flex-wrap gap-1.5">
            {visibleTechnologies.map((technology) => (
              <li key={technology.id} className="min-w-0 max-w-full">
                <Chip className="max-w-full overflow-hidden">
                  <span className="min-w-0 truncate">{technology.name}</span>
                </Chip>
              </li>
            ))}
            {remaining > 0 ? (
              <li
                className="flex items-center text-xs leading-6 text-fg-subtle"
                title={`${remaining} more ${remaining === 1 ? "technology" : "technologies"}`}
              >
                <span aria-hidden="true">+{remaining}</span>
                <span className="sr-only"> {remaining} more technologies</span>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/8 pt-3 sm:pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition group-hover:text-accent-200">
            View details
            <ArrowRight aria-hidden="true" className="size-4" />
          </span>

          {hasLink(project.githubUrl) ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${project.title} source code on GitHub`}
              className="relative z-10 flex size-9 items-center justify-center rounded-lg border border-white/10 text-fg-muted transition hover:border-accent-500/40 hover:text-accent-200"
            >
              <GithubIcon className="size-4" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

interface ProjectGridProps {
  projects: ProjectDto[];
  className?: string;
}

export function ProjectGrid({ projects, className = "" }: ProjectGridProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${className}`}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
