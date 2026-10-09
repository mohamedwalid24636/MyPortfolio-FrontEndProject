import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SkillGroup } from "@/lib/skills";

interface SkillsAccordionProps {
  groups: SkillGroup[];
}

/**
 * Compact, mobile-only view of the skill groups.
 *
 * The resume is long, so on phones the skills are collapsed into one open group at a time. The
 * panel is always in the DOM (so `aria-controls` always resolves) and simply hidden while closed.
 */
export function SkillsAccordion({ groups }: SkillsAccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null);

  if (groups.length === 0) return null;

  return (
    <div className="divide-y divide-white/8">
      {groups.map((group) => {
        const isOpen = openKey === group.key;
        const buttonId = `skill-group-${group.key}`;
        const panelId = `skill-panel-${group.key}`;

        return (
          <div key={group.key}>
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenKey(isOpen ? null : group.key)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
            >
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent-300">
                {group.title}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`size-4 shrink-0 text-fg-subtle transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div id={panelId} role="region" aria-labelledby={buttonId} className={isOpen ? "pb-4" : "hidden"}>
              {isOpen ? (
                <ul className="grid grid-cols-1 gap-1.5 min-[360px]:grid-cols-2">
                  {group.skills.map((skill) => (
                    <li
                      key={`${group.key}-${skill.id}`}
                      className="flex items-baseline gap-2 text-sm leading-snug text-fg-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1 shrink-0 translate-y-[-2px] rounded-full bg-accent-500/70"
                      />
                      <span className="min-w-0">{skill.name}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
