import type { SkillDto, TypeDto } from "@/types/api";

/**
 * The backend stores proficiency as free text (e.g. "Advanced", "85%", "3/5").
 * These helpers turn it into a displayable percentage where possible.
 */
const KEYWORD_LEVELS: Record<string, number> = {
  beginner: 35,
  basic: 35,
  novice: 30,
  intermediate: 60,
  "intermediate+": 70,
  advanced: 82,
  expert: 95,
  proficient: 78,
  "highly proficient": 88,
};

export function parseProficiency(level: string | null | undefined): number | null {
  if (!level) return null;
  const value = level.trim().toLowerCase();
  if (!value) return null;

  // "80", "80%"
  const numeric = /^(\d{1,3})\s*%?$/.exec(value);
  if (numeric) {
    const parsed = Number(numeric[1]);
    return parsed >= 0 && parsed <= 100 ? parsed : null;
  }

  // "4/5"
  const fraction = /^(\d(?:\.\d+)?)\s*\/\s*(\d(?:\.\d+)?)$/.exec(value);
  if (fraction) {
    const [, numerator, denominator] = fraction;
    const total = Number(denominator);
    if (total > 0) return Math.round((Number(numerator) / total) * 100);
  }

  return KEYWORD_LEVELS[value] ?? null;
}

export interface SkillGroup {
  key: string;
  title: string;
  description?: string;
  skills: SkillDto[];
}

/**
 * Groups skills by their related skill type. Skills without a type are collected
 * into a trailing "Other" group so nothing is silently dropped.
 *
 * By default a skill shows up under every type it belongs to. Pass `{ unique: true }`
 * to list each skill once — under its primary type only — which keeps dense views
 * (like the resume) compact and free of duplicates.
 */
export function groupSkillsByType(
  skills: SkillDto[],
  types: TypeDto[],
  options: { unique?: boolean } = {},
): SkillGroup[] {
  const groups = new Map<string, SkillGroup>();

  const ensureGroup = (type: TypeDto | null): SkillGroup => {
    const key = type ? `type-${type.id}` : "type-unassigned";
    const existing = groups.get(key);
    if (existing) return existing;

    const created: SkillGroup = {
      key,
      title: type?.name || "Other",
      description: type?.description,
      skills: [],
    };
    groups.set(key, created);
    return created;
  };

  skills.forEach((skill) => {
    const primaryType = skill.types?.[0] ?? null;
    ensureGroup(primaryType).skills.push(skill);

    if (options.unique) return;

    // A skill can belong to several types; register it in each of the others too.
    (skill.types ?? []).slice(1).forEach((type) => ensureGroup(type).skills.push(skill));
  });

  // Keep an explicit order when the API provides the type list, then leftovers.
  const orderedKeys = types
    .map((type) => `type-${type.id}`)
    .filter((key) => groups.has(key));

  return [
    ...orderedKeys.map((key) => groups.get(key)!),
    ...[...groups.values()].filter((group) => !orderedKeys.includes(group.key)),
  ];
}
