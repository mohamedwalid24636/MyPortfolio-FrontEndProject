import { createWriteService } from "@/services/crud";
import type { CreateSkillDto, SkillDto, UpdateSkillDto } from "@/types/api";

/**
 * Skills own an icon and a many-to-many relation to skill types, so their write contract is
 * `multipart/form-data`: `icon` carries the bytes, `isDelete` retires the stored one and `typeIds`
 * arrives as repeated fields. The backend replaces the whole type assignment.
 */
export const skillService = createWriteService<SkillDto, CreateSkillDto, UpdateSkillDto>(
  "Skills",
  "form",
);