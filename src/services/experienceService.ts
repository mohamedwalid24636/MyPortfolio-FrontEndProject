import { createWriteService } from "@/services/crud";
import type { CreateExperienceDto, ExperienceDto, UpdateExperienceDto } from "@/types/api";

/** Experience owns a company logo, so its write contract is `multipart/form-data`. */
export const experienceService = createWriteService<
  ExperienceDto,
  CreateExperienceDto,
  UpdateExperienceDto
>("Experiences", "form");