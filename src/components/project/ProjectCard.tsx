import { Link } from "react-router-dom";
import { ArrowUpRight, Star } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Chip } from "@/components/ui/Chip";
import { SmartImage } from "@/components/ui/SmartImage";
import { hasLink } from "@/lib/media";
import type { ProjectDto } from "@/types/api";

const MAX_VISIBLE_TAGS = 4;

interface ProjectCardProps {
  project: ProjectDto;
  /** Adds a subtle 3D tilt on pointer movement (desktop only). */
  tilt?: boolean;
}

export function ProjectCard({ project, tilt = true }: ProjectCardProps) {
  const technologies = project.technologies ?? [];
  const categories = project.categories ?? [];
  const visibleTechnologies = technologies.slice(0, MAX_VISIBLE_TAGS);
  const remaining = technologies.length - visibleTechnologies.length;

  return (
    <article
      className="card card-hover group flex h-full flex-col"
      style={tilt ? { transform: "translateZ(0)" } : undefined}
    >
      <Link
        to={`/projects/${project.id}`}
        className="relative block aspect-[16/10] overflow-hidden"
        aria-label={`View details for ${project.title}`}
      >
        <SmartImage
          src={project.imageUrl}
          alt={`${project.title} preview`}
          eager={false}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4">
          {project.status ? <Chip variant="accent">{project.status}</Chip> : null}
          {project.featured ? (
            <Chip>
              <Star aria-hidden="true" className="size-3 text-amber-300" />
              Featured
            </Chip>
          ) : null}
        </div>

        <span className="absolute right-4 top-4 flex size-9 translate-y-2 items-center justify-center rounded-xl border border-white/15 bg-ink-950/80 text-fg opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
          {categories.length > 0 ? (
            <span className="font-mono uppercase tracking-wider">{categories[0].name}</span>
          ) : null}
          {project.startDate ? (
            <span>{new Date(project.startDate).getFullYear()}</span>
          ) : null}
        </div>

        <h3 className="font-display text-lg leading-snug font-semibold text-fg transition-colors group-hover:text-accent-200">
          <Link to={`/projects/${project.id}`}>{project.title}</Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-fg-muted">
          {project.shortDescription || project.description}
        </p>

        {visibleTechnologies.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {visibleTechnologies.map((technology) => (
              <li key={technology.id}>
                <Chip>{technology.name}</Chip>
              </li>
            ))}
            {remaining > 0 ? <li className="text-xs leading-6 text-fg-subtle">+{remaining}</li> : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition hover:gap-2.5 hover:text-accent-200"
          >
            View project
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>

          {hasLink(project.githubUrl) ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${project.title} source code on GitHub`}
              className="ml-auto flex size-9 items-center justify-center rounded-lg border border-white/10 text-fg-muted transition hover:border-accent-500/40 hover:text-accent-200"
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
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
