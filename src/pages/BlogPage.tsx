import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Clock, Newspaper } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { DataSection } from "@/components/ui/DataSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ArticleListSkeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { useAllBlogPosts } from "@/hooks/usePortfolioData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSiteData } from "@/context/SiteDataContext";
import { estimateReadingTime, formatFullDate } from "@/lib/format";
import { hasLink } from "@/lib/media";
import type { BlogPostDto } from "@/types/api";

function BlogCard({ post, index }: { post: BlogPostDto; index: number }) {
  const published = formatFullDate(post.publishedAt);
  const readingTime = post.readingTime > 0 ? post.readingTime : estimateReadingTime(post.content);
  const href = `/blog/${post.slug || post.id}`;

  return (
    <Reveal delay={Math.min(index * 0.07, 0.28)} className="h-full">
      <article className="card card-hover group h-full">
        <div className="flex flex-col sm:flex-row">
          {hasLink(post.coverImageUrl) ? (
            <div className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-56">
              <SmartImage
                src={post.coverImageUrl}
                alt={post.title}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ) : null}

          <div className="flex flex-1 flex-col p-6">
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

            <h2 className="mt-3 font-display text-lg leading-snug font-semibold text-fg transition-colors group-hover:text-accent-200">
              <Link to={href} className="after:absolute after:inset-0">
                {post.title}
              </Link>
            </h2>

            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
              {post.shortDescription || "No summary provided for this article."}
            </p>

            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-accent-300 transition group-hover:gap-2.5 group-hover:text-accent-200">
              Read article
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export default function BlogPage() {
  const { data: siteData } = useSiteData();
  usePageMeta(
    siteData.profile?.fullName ? `Blog | ${siteData.profile.fullName}` : "Blog",
    "Notes on backend development with ASP.NET Core, Entity Framework Core and clean architecture.",
  );

  const { data, isLoading, error, reload } = useAllBlogPosts();
  const posts = [...(data ?? [])].sort((a, b) => {
    const left = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const right = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return right - left;
  });

  return (
    <>
      <PageHeader
        eyebrow="Writing"
        title={
          <>
            Notes on <span className="heading-gradient">building backends</span>
          </>
        }
        description="Short write-ups about architecture decisions, Entity Framework Core patterns and lessons from real projects."
      />

      <section className="section pt-14">
        <div className="container-page">
          <DataSection
            items={posts}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={<ArticleListSkeleton count={3} />}
            empty={
              <EmptyState
                icon={Newspaper}
                title="No articles published yet"
                description="Posts written through the API will appear here."
              />
            }
          >
            {(items) => (
              <div className="space-y-6">
                {items.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </div>
            )}
          </DataSection>
        </div>
      </section>
    </>
  );
}
