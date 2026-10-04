import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDateRange } from "@/lib/format";
import { useSiteData } from "@/context/SiteDataContext";

export function EducationSection() {
  const { data, isLoading, error, reload } = useSiteData();

  return (
    <section className="section scroll-mt-24">
      <div className="container-page">
        <div>
            <SectionHeading
              eyebrow="Education"
              title="Academic background"
              description="Computer science fundamentals, applied through a final-year engineering project."
            />

            <div className="mt-12">
              <DataSection
                items={data.educations}
                isLoading={isLoading}
                error={error}
                onRetry={reload}
                skeleton={
                  <div className="space-y-5" aria-busy="true">
                    {Array.from({ length: 2 }, (_, index) => (
                      <div key={index} className="card space-y-3 p-6">
                        <div className="skeleton h-5 w-1/2" />
                        <div className="skeleton h-3 w-1/3" />
                        <div className="skeleton h-3 w-full" />
                      </div>
                    ))}
                  </div>
                }
                empty={
                  <EmptyState
                    icon={GraduationCap}
                    title="No education entries yet"
                    description="Education records added through the API will appear here."
                  />
                }
              >
                {(items) => (
                  <div className="space-y-5">
                    {items.map((education, index) => (
                      <Reveal key={education.id} delay={index * 0.08}>
                        <article className="card card-hover flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
                          {education.institutionLogoUrl ? (
                            <SmartImage
                              src={education.institutionLogoUrl}
                              alt={`${education.institutionName} logo`}
                              className="size-14 shrink-0 rounded-xl border border-white/10 object-contain"
                            />
                          ) : (
                            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent-300">
                              <GraduationCap aria-hidden="true" className="size-6" />
                            </span>
                          )}

                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-semibold text-fg">{education.degree}</h3>
                            <p className="mt-1 text-sm text-accent-300">{education.institutionName}</p>
                            <p className="mt-1 text-xs text-fg-subtle">
                              {formatDateRange(education.startDate, education.endDate, education.isCurrent)}
                              {education.fieldOfStudy ? ` · ${education.fieldOfStudy}` : ""}
                            </p>
                            {education.description ? (
                              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{education.description}</p>
                            ) : null}
                          </div>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                )}
              </DataSection>
            </div>
        </div>
      </div>
    </section>
  );
}
