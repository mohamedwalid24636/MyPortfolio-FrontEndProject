import type { ExperienceDto } from "@/types/api";

/**
 * The API keeps every job, internship and training programme in a single `Experience` table and
 * that is exactly where they belong on the site: experience is experience. Nothing here guesses at
 * a record's intent from its title or employer, so a future entry can never be silently re-homed
 * into the wrong section.
 *
 * Education is sourced only from the dedicated Education API (see `useSiteData().educations`).
 */
export function getExperiences(experiences: ExperienceDto[] | null | undefined): ExperienceDto[] {
  return experiences ?? [];
}

/** True when the API actually holds at least one experience record. */
export function hasExperiences(experiences: ExperienceDto[] | null | undefined): boolean {
  return getExperiences(experiences).length > 0;
}
