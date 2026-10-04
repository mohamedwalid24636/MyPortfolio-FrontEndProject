import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Layers,
  Tag as TagIcon,
  Wrench,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Chip } from "@/components/ui/Chip";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundBlock } from "@/components/ui/NotFoundBlock";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { useProject } from "@/hooks/usePortfolioData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import { formatDateRange } from "@/lib/format";
import { hasLink } from "@/lib/media";

function DetailSkeleton() {
  return (
    <div className="container-page space-y-8 py-32" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = useMemo(() => {
    const parsed = Number(params.id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [params.id]);

  const { data: project, isLoading, error, reload } = useProject(projectId);
  const { data: siteData } = useSiteData();

  usePageMeta(
    project ? `${project.title} | ${siteData.profile?.fullName || "Portfolio"}` : "Project | Portfolio",
    project?.shortDescription || "Project details, technologies and source code.",
  );

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="container-page py-32">
        <ErrorState onRetry={reload} />
      </div>
    );
  }

  if (!project) {
    return (
      <NotFoundBlock
        title="Project not found"
        description="This project does not exist or has been unpublished. Browse the full catalogue instead."
        showProjectsLink
      />
    );
  }

  const technologies = project.technologies ?? [];
  const categories = project.categories ?? [];
  const tags = project.tags ?? [];
  const images = (project.images ?? []).filter((image) => hasLink(image.imageUrl));
  const paragraphs = (project.description || project.shortDescription)
    .split(/(?<=[.!?])\s+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="pt-32 sm:pt-36">
      <div className="container-page">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition hover:gap-3 hover:text-accent-200"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All projects
        </Link>

        <Reveal className="mt-7 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {project.status ? <Chip variant="accent">{project.status}</Chip> : null}
            {categories.slice(0, 2).map((category) => (
              <Chip key={category.id}>{category.name}</Chip>
            ))}
          </div>

          <h1 className="mt-5 font-display text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
            {project.title}
          </h1>

          {project.shortDescription ? (
            <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{project.shortDescription}</p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {hasLink(project.githubUrl) ? (
              <a href={project.githubUrl} target="_blank" rel="noreferrer noopener" className="btn-primary">
                <GithubIcon className="size-4" />
                View source
              </a>
            ) : null}
            {hasLink(project.liveDemoUrl) ? (
              <a href={project.liveDemoUrl} target="_blank" rel="noreferrer noopener" className="btn-outline">
                <ExternalLink aria-hidden="true" className="size-4" />
                Live demo
              </a>
            ) : null}
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.08} className="container-page mt-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-850">
          <SmartImage
            src={project.imageUrl}
            alt={`${project.title} cover image`}
            eager
            className="aspect-[21/9] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
        </div>
      </Reveal>

      <div className="container-page mt-14 grid gap-12 pb-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold">About this project</h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-fg-muted">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              ) : (
                <p>No description has been provided for this project yet.</p>
              )}
            </div>
          </Reveal>

          {images.length > 0 ? (
            <Reveal delay={0.06} className="mt-14">
              <h2 className="font-display text-2xl font-bold">Gallery</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {images.map((image) => (
                  <figure key={image.id} className="card overflow-hidden">
                    <SmartImage
                      src={image.imageUrl}
                      alt={image.caption || `${project.title} screenshot`}
                      className="aspect-[16/10] w-full object-cover"
                    />
                    {image.caption ? (
                      <figcaption className="px-4 py-3 text-xs text-fg-muted">{image.caption}</figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Reveal delay={0.05}>
            <div className="card p-6">
              <h2 className="font-display text-sm uppercase tracking-[0.16em] text-fg-subtle">Project details</h2>

              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="flex items-center gap-2 text-fg-subtle">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    Period
                  </dt>
                  <dd className="text-right font-medium text-fg">
                    {formatDateRange(project.startDate, project.endDate)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="flex items-center gap-2 text-fg-subtle">
                    <Layers aria-hidden="true" className="size-4" />
                    Status
                  </dt>
                  <dd className="text-right font-medium text-fg">{project.status || "—"}</dd>
                </div>
              </dl>

              {technologies.length > 0 ? (
                <div className="mt-6 border-t border-white/8 pt-5">
                  <h3 className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                    <Wrench aria-hidden="true" className="size-3.5" />
                    Technologies
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {technologies.map((technology) => (
                      <li key={technology.id}>
                        <Chip>
                          <span className="inline-flex items-center gap-1.5">
                            {hasLink(technology.iconUrl) ? <SmartImage src={technology.iconUrl} alt="" className="size-3.5 rounded object-contain" /> : null}
                            {technology.name}
                          </span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {categories.length > 0 ? (
                <div className="mt-5 border-t border-white/8 pt-5">
                  <h3 className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                    <Layers aria-hidden="true" className="size-3.5" />
                    Categories
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Chip>{category.name}</Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {tags.length > 0 ? (
                <div className="mt-5 border-t border-white/8 pt-5">
                  <h3 className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                    <TagIcon aria-hidden="true" className="size-3.5" />
                    Tags
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li key={tag.id}>
                        <Chip>#{tag.slug || tag.name}</Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Reveal>

          {hasLink(project.githubUrl) || hasLink(project.liveDemoUrl) ? (
            <Reveal delay={0.1}>
              <div className="card p-6">
                <h2 className="font-display text-sm uppercase tracking-[0.16em] text-fg-subtle">Links</h2>
                <ul className="mt-4 space-y-2.5">
                  {hasLink(project.githubUrl) ? (
                    <li>
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-fg-muted transition hover:border-accent-500/40 hover:text-accent-200"
                      >
                        <span className="flex items-center gap-2.5">
                          <GithubIcon className="size-4" />
                          Source code
                        </span>
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    </li>
                  ) : null}
                  {hasLink(project.liveDemoUrl) ? (
                    <li>
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-fg-muted transition hover:border-accent-500/40 hover:text-accent-200"
                      >
                        <span className="flex items-center gap-2.5">
                          <ExternalLink aria-hidden="true" className="size-4" />
                          Live demo
                        </span>
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            </Reveal>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
