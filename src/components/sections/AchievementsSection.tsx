import { Award, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatFullDate } from "@/lib/format";
import { hasLink } from "@/lib/media";
import { useSiteData } from "@/context/SiteDataContext";

export function AchievementsSection() {
  const { data, isLoading, error, reload } = useSiteData();

  return (
    <section id="achievements" className="section scroll-mt-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Milestones"
          title="Achievements & awards"
          description="Rankings and recognitions that reflect the quality of the work delivered."
        />

        <div className="mt-12">
          <DataSection
            items={data.achievements}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="card space-y-3 p-6">
                    <div className="skeleton h-5 w-2/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-4/5" />
                  </div>
                ))}
              </div>
            }
            empty={
              <EmptyState
                icon={Award}
                title="No achievements yet"
                description="Awards added through the API will appear in this grid."
              />
            }
          >
            {(items) => (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((achievement, index) => (
                  <Reveal key={achievement.id} delay={index * 0.08} className="h-full">
                    <article className="card card-hover group flex h-full flex-col p-6">
                      <div className="flex items-start justify-between">
                        <span className="flex size-11 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] text-amber-300 transition duration-300 group-hover:scale-105">
                          <Award aria-hidden="true" className="size-5" />
                        </span>
                        {achievement.date ? (
                          <span className="chip">{formatFullDate(achievement.date)}</span>
                        ) : null}
                      </div>

                      {hasLink(achievement.imageUrl) ? (
                        <SmartImage
                          src={achievement.imageUrl}
                          alt={achievement.title}
                          className="mt-5 aspect-[16/9] w-full rounded-xl object-cover"
                        />
                      ) : null}

                      <h3 className="mt-5 font-display text-lg font-semibold text-fg transition-colors group-hover:text-accent-200">
                        {achievement.title}
                      </h3>
                      {achievement.description ? (
                        <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{achievement.description}</p>
                      ) : null}

                      {hasLink(achievement.url) ? (
                        <div className="mt-auto pt-5">
                          <a
                            href={achievement.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition hover:gap-2.5 hover:text-accent-200"
                          >
                            View details
                            <ExternalLink aria-hidden="true" className="size-4" />
                          </a>
                        </div>
                      ) : null}
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
          </DataSection>
        </div>
      </div>
    </section>
  );
}
