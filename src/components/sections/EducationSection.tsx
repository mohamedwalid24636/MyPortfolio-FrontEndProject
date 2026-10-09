import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDateRange } from "@/lib/format";
import { hasLink } from "@/lib/media";
import { useSiteData } from "@/context/SiteDataContext";
import type { EducationDto } from "@/types/api";

function EducationCard({ education }: { education: EducationDto }) {
  return (
    <article className="card card-hover flex h-full flex-row items-start gap-4 p-5 sm:gap-6 sm:p-6">
      {hasLink(education.institutionLogoUrl) ? (
        <SmartImage
          src={education.institutionLogoUrl}
          alt={`${education.institutionName} logo`}
          className="size-12 shrink-0 rounded-xl border border-white/10 object-contain sm:size-14"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent-300 sm:size-14">
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
  );
}

/**
 * Academic background, taken only from the Education API.
 *
 * Experience records are never reclassified into this section — a training programme stays under
 * Experience where the API puts it — so what a visitor reads here is exactly the academic history.
 */
export function EducationSection() {
  const { data, isLoading, error, reload } = useSiteData();

  return (
    <section id="education" className="section scroll-mt-24 border-t border-white/[0.06]">
      <div className="container-page">
        <SectionHeading
          eyebrow="Education"
          title="Academic background"
          description="Where the computer science foundation was built."
        />

        <div className="mt-8 sm:mt-10">
          <DataSection
            items={data.educations}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5" aria-busy="true">
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
                compact
              />
            }
          >
            {(items) => (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                {items.map((education) => (
                  <Reveal key={education.id} className="h-full">
                    <EducationCard education={education} />
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
