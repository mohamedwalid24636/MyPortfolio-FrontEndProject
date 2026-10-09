import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Layers,
  Star,
  Tag as TagIcon,
  Wrench,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Chip } from "@/components/ui/Chip";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundBlock } from "@/components/ui/NotFoundBlock";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { MediaCarousel, type MediaCarouselItem } from "@/components/project/MediaCarousel";
import { useProject } from "@/hooks/usePortfolioData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import { formatDateRange, toParagraphs } from "@/lib/format";
import { hasLink, resolveImageUrl } from "@/lib/media";

function DetailSkeleton() {
  return (
    <div className="container-page space-y-8 pt-28 sm:pt-32" aria-busy="true">
      <Skeleton className="h-4 w-48" />
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

  /*
   * The cover and the gallery live in separate API fields. They are stitched into one ordered,
   * URL-deduplicated list here so the carousel can treat them as a single gallery.
   */
  const galleryImages = [...(project.images ?? [])]
    .filter((image) => hasLink(image.imageUrl))
    .sort((left, right) => (Number(left.displayOrder) || 0) - (Number(right.displayOrder) || 0));

  const media: MediaCarouselItem[] = [];
  const seenMedia = new Set<string>();
  if (hasLink(project.imageUrl)) {
    media.push({ id: "cover", url: project.imageUrl });
    seenMedia.add(resolveImageUrl(project.imageUrl));
  }
  galleryImages.forEach((image) => {
    const key = resolveImageUrl(image.imageUrl);
    if (seenMedia.has(key)) return;
    seenMedia.add(key);
    media.push({ id: image.id, url: image.imageUrl, caption: image.caption || undefined });
  });

  const paragraphs = toParagraphs(project.description || project.shortDescription);
  const hasGithub = hasLink(project.githubUrl);
  const hasDemo = hasLink(project.liveDemoUrl);

  return (
    <article className="pt-28 sm:pt-32">
      <div className="container-page">
        <Breadcrumbs items={[{ label: "Projects", to: "/projects" }, { label: project.title }]} />

        <Reveal className="mt-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {project.status ? <Chip variant="accent">{project.status}</Chip> : null}
            {categories.slice(0, 2).map((category) => (
              <Chip key={category.id}>{category.name}</Chip>
            ))}
            {project.featured ? (
              <Chip>
                <Star aria-hidden="true" className="size-3 text-amber-300" />
                Featured
              </Chip>
            ) : null}
          </div>

          <h1 className="mt-5 font-display text-3xl leading-[1.1] font-bold sm:text-4xl lg:text-5xl">
            {project.title}
          </h1>

          {project.shortDescription ? (
            <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{project.shortDescription}</p>
          ) : null}

          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
            <CalendarDays aria-hidden="true" className="size-4 text-accent-400" />
            {formatDateRange(project.startDate, project.endDate)}
          </p>

          {hasGithub || hasDemo ? (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {hasGithub ? (
                <a href={project.githubUrl} target="_blank" rel="noreferrer noopener" className="btn-primary">
                  <GithubIcon className="size-4" />
                  View source
                </a>
              ) : null}
              {hasDemo ? (
                <a href={project.liveDemoUrl} target="_blank" rel="noreferrer noopener" className="btn-outline">
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Live demo
                </a>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>

      {media.length > 0 ? (
        <Reveal delay={0.08} className="container-page mt-10">
          <MediaCarousel items={media} title={project.title} />
        </Reveal>
      ) : null}

      <div className="container-page mt-12 grid gap-10 pb-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
        {/* Main column — the case study */}
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold">Overview</h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-fg-muted">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              ) : (
                <p>No description has been provided for this project yet.</p>
              )}
            </div>
          </Reveal>
        </div>

        {/* Sidebar — facts, stack and links */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Reveal delay={0.05}>
            <div className="card p-6">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
                Project details
              </h2>

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
                <div className="mt-6 border-t border-white/10 pt-5">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
                    <Wrench aria-hidden="true" className="size-3.5" />
                    Technologies
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {technologies.map((technology) => (
                      <li key={technology.id}>
                        <Chip>
                          <span className="inline-flex items-center gap-1.5">
                            {hasLink(technology.iconUrl) ? (
                              <SmartImage
                                src={technology.iconUrl}
                                alt=""
                                className="size-3.5 rounded object-contain"
                              />
                            ) : null}
                            {technology.name}
                          </span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {categories.length > 0 ? (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
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
                <div className="mt-5 border-t border-white/10 pt-5">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
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

          {hasGithub || hasDemo ? (
            <Reveal delay={0.1}>
              <div className="card p-6">
                <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
                  Links
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {hasGithub ? (
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
                  {hasDemo ? (
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

          <Reveal delay={0.14}>
            <Link to="/projects" className="btn-outline w-full">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to all projects
            </Link>
          </Reveal>
        </aside>
      </div>
    </article>
  );
}
