import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DataSection } from "@/components/ui/DataSection";
import { SmartImage } from "@/components/ui/SmartImage";
import { groupSkillsByType, parseProficiency } from "@/lib/skills";
import { useSiteData } from "@/context/SiteDataContext";
import type { SkillDto } from "@/types/api";
import { hasLink } from "@/lib/media";

function SkillCard({ skill, index }: { skill: SkillDto; index: number }) {
  const percentage = parseProficiency(skill.proficiencyLevel);
  const levelLabel = skill.proficiencyLevel?.trim();

  return (
    <Reveal delay={Math.min(index * 0.05, 0.3)} className="h-full">
      <div className="card h-full p-5 transition duration-300 hover:border-accent-500/30 hover:bg-ink-800/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {hasLink(skill.iconUrl) ? <SmartImage src={skill.iconUrl} alt="" className="size-6 rounded object-contain" /> : null}
            <h3 className="truncate font-display text-sm font-semibold text-fg">{skill.name}</h3>
          </div>
          {levelLabel ? <span className="chip-accent shrink-0 !px-2.5 !py-0.5 text-[0.7rem]">{levelLabel}</span> : null}
        </div>

        {skill.description ? <p className="mt-2 text-xs leading-relaxed text-fg-muted">{skill.description}</p> : null}

        {percentage !== null ? (
          <div className="mt-4">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/8"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${skill.name} proficiency`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyan-400 transition-[width] duration-700"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </Reveal>
  );
}

export function SkillsSection() {
  const { data, isLoading, error, reload } = useSiteData();
  const groups = groupSkillsByType(data.skills, data.types);

  return (
    <section id="skills" className="section scroll-mt-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Technical skills"
          title="Tools I reach for"
          description="Organised by category so you can quickly see where I am strongest and where I am still growing."
        />

        <div className="mt-12 space-y-12">
          <DataSection
            items={data.skills}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeleton={
              <div className="space-y-8" aria-busy="true">
                {Array.from({ length: 2 }, (_, groupIndex) => (
                  <div key={groupIndex} className="space-y-4">
                    <div className="skeleton h-6 w-40" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {Array.from({ length: 4 }, (_, index) => (
                        <div key={index} className="card space-y-3 p-5">
                          <div className="skeleton h-4 w-2/3" />
                          <div className="skeleton h-3 w-full" />
                          <div className="skeleton h-1.5 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
            empty={
              <EmptyState
                title="No skills published yet"
                description="Skills added through the API will be grouped and displayed here automatically."
              />
            }
          >
            {() =>
              groups.map((group) => (
                <div key={group.key}>
                  <Reveal className="mb-5 flex flex-wrap items-baseline gap-3">
                    <h3 className="font-display text-xl font-semibold text-fg">{group.title}</h3>
                    {group.description ? (
                      <p className="text-sm text-fg-muted">{group.description}</p>
                    ) : null}
                  </Reveal>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {group.skills.map((skill, index) => (
                      <SkillCard key={`${group.key}-${skill.id}`} skill={skill} index={index} />
                    ))}
                  </div>
                </div>
              ))
            }
          </DataSection>
        </div>
      </div>
    </section>
  );
}
