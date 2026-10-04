import { createWriteService } from "@/services/crud";
import type { CreateEducationDto, EducationDto, UpdateEducationDto } from "@/types/api";

/** Education owns an institution logo, so its write contract is `multipart/form-data`. */
export const educationService = createWriteService<
  EducationDto,
  CreateEducationDto,
  UpdateEducationDto
>("Educations", "form");