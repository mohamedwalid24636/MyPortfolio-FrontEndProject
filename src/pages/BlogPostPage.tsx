import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Newspaper, Share2 } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundBlock } from "@/components/ui/NotFoundBlock";
import { ProseContent } from "@/components/ui/ProseContent";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { useBlogPost } from "@/hooks/usePortfolioData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import { estimateReadingTime, formatFullDate } from "@/lib/format";
import { hasLink } from "@/lib/media";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const slugParam = useMemo(() => slug ?? null, [slug]);
  const { data: post, isLoading, error, reload } = useBlogPost(slugParam);
  const { data: siteData } = useSiteData();

  usePageMeta(
    post ? `${post.title} | ${siteData.profile?.fullName || "Portfolio"}` : "Article | Portfolio",
    post?.shortDescription || "Article",
  );

  if (isLoading) {
    return (
      <div className="container-page space-y-6 py-32" aria-busy="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-32">
        <ErrorState onRetry={reload} />
      </div>
    );
  }

  if (!post) {
    return (
      <NotFoundBlock
        title="Article not found"
        description="This article does not exist or is no longer published."
      />
    );
  }

  const published = formatFullDate(post.publishedAt);
  const readingTime = post.readingTime > 0 ? post.readingTime : estimateReadingTime(post.content);

  return (
    <article className="pt-32 sm:pt-36">
      <div className="container-page">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition hover:gap-3 hover:text-accent-200"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All articles
        </Link>

        <Reveal className="mt-7 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {post.status ? <Chip variant="accent">{post.status}</Chip> : null}
            {published ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {published}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
              <Clock aria-hidden="true" className="size-3.5" />
              {readingTime} min read
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.shortDescription ? (
            <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{post.shortDescription}</p>
          ) : null}
        </Reveal>
      </div>

      {hasLink(post.coverImageUrl) ? (
        <Reveal delay={0.08} className="container-page mt-12">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink-850">
            <SmartImage
              src={post.coverImageUrl}
              alt={post.title}
              eager
              className="aspect-[21/9] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/45 to-transparent" />
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.1} className="container-page mt-14 max-w-3xl pb-10">
        <ProseContent content={post.content} />

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-8">
          <Link to="/blog" className="btn-outline">
            <Newspaper aria-hidden="true" className="size-4" />
            More articles
          </Link>
          <a
            href={typeof window !== "undefined" ? window.location.href : "#"}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost"
          >
            <Share2 aria-hidden="true" className="size-4" />
            Share link
          </a>
        </div>
      </Reveal>
    </article>
  );
}
