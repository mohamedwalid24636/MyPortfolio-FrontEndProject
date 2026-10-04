import { Briefcase, Building2, CalendarDays, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { SmartImage } from "@/components/ui/SmartImage";
import { TimelineSkeleton } from "@/components/ui/Skeleton";
import { formatDateRange, toBulletList } from "@/lib/format";
import { hasLink } from "@/lib/media";
import { useSiteData } from "@/context/SiteDataContext";
import type { ExperienceDto } from "@/types/api";

function ExperienceItem({ experience, isLast }: { experience: ExperienceDto; isLast: boolean }) {
  const bullets = toBulletList(experience.description);

  return (
    <li className="relative pl-10 sm:pl-14">
      <span
        aria-hidden="true"
        className="absolute left-3 top-2 flex size-3.5 items-center justify-center rounded-full border-2 border-accent-400 bg-ink-950 sm:left-4"
      >
        <span className="size-1.5 rounded-full bg-accent-400" />
      </span>
      {!isLast ? (
        <span aria-hidden="true" className="absolute left-[1.42rem] top-8 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-accent-500/40 to-transparent sm:left-[1.92rem]" />
      ) : null}

      <Reveal className="card card-hover p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {hasLink(experience.companyLogoUrl) ? (
              <SmartImage
                src={experience.companyLogoUrl}
                alt={`${experience.companyName} logo`}
                className="size-11 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] object-contain p-1"
              />
            ) : null}
            <div>
              <h3 className="font-display text-lg font-semibold text-fg">{experience.jobTitle}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-accent-300">
                <Building2 aria-hidden="true" className="size-4" />
                {experience.companyName}
              </p>
            </div>
          </div>

          <span className="chip">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-subtle">
          {experience.location ? (
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-3.5" />
              {experience.location}
            </span>
          ) : null}
          {experience.employmentType ? <span>{experience.employmentType}</span> : null}
          {experience.isCurrent ? <span className="text-emerald-300">Current</span> : null}
        </div>

        {bullets.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {bullets.map((bullet, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent-500/70" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Reveal>
    </li>
  );
}

export function ExperienceSection() {
  const { data, isLoading, error, reload } = useSiteData();

  return (
    <section id="experience" className="section scroll-mt-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Experience"
          title="Where I have worked"
          description="Formal roles and intensive training programmes that shaped how I build software."
        />

        <div className="mt-12">
          <DataSection
            items={data.experiences}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={<TimelineSkeleton count={2} />}
            empty={
              <EmptyState
                icon={Briefcase}
                title="No experience entries yet"
                description="Roles added through the API will appear on this timeline."
              />
            }
          >
            {(items) => (
              <ol className="space-y-6">
                {items.map((experience, index) => (
                  <ExperienceItem key={experience.id} experience={experience} isLast={index === items.length - 1} />
                ))}
              </ol>
            )}
          </DataSection>
        </div>
      </div>
    </section>
  );
}
