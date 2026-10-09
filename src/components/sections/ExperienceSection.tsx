import { Briefcase, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { getExperiences } from "@/lib/experiences";
import { formatDateRange, toBulletList } from "@/lib/format";
import { hasLink } from "@/lib/media";
import { useSiteData } from "@/context/SiteDataContext";
import type { ExperienceDto } from "@/types/api";

function ExperienceItem({ experience }: { experience: ExperienceDto }) {
  const bullets = toBulletList(experience.description);
  const meta = [experience.employmentType, experience.location].filter(Boolean).join(" · ");

  return (
    <article className="card card-hover p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        {hasLink(experience.companyLogoUrl) ? (
          <SmartImage
            src={experience.companyLogoUrl}
            alt={`${experience.companyName} logo`}
            className="size-12 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] object-contain p-1 sm:size-14"
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent-300 sm:size-14">
            <Briefcase aria-hidden="true" className="size-5 sm:size-6" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-fg sm:text-lg">
                {experience.jobTitle}
              </h3>
              <p className="mt-0.5 text-sm text-accent-300">{experience.companyName}</p>
            </div>
            <span className="chip shrink-0">
              {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
            </span>
          </div>

          {meta ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
              {experience.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-3.5 text-accent-400" />
                  {experience.location}
                </span>
              ) : null}
              {experience.employmentType ? <span>{experience.employmentType}</span> : null}
            </p>
          ) : null}
        </div>
      </div>

      {bullets.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent-500/70" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/**
 * Work history for the home page.
 *
 * Every record the API publishes under `Experience` is shown here verbatim — the section is
 * rendered only when at least one such record exists, so an empty version never shows up as a
 * dangling heading or a dead `#experience` anchor.
 */
export function ExperienceSection() {
  const { data, isLoading } = useSiteData();
  const experiences = getExperiences(data.experiences);

  if (isLoading || experiences.length === 0) return null;

  return (
    <section id="experience" className="section scroll-mt-24 border-t border-white/[0.06]">
      <div className="container-page">
        <SectionHeading
          eyebrow="Experience"
          title="Where I have worked"
          description="The roles, teams and problems I have shipped production work with."
        />

        <div className="mt-8 sm:mt-10">
          <ol className="space-y-4 sm:space-y-5">
            {experiences.map((experience, index) => (
              <li key={experience.id}>
                <Reveal delay={index * 0.05}>
                  <ExperienceItem experience={experience} />
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
