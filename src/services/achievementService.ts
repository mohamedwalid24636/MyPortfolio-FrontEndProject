import { createWriteService } from "@/services/crud";
import type {
  CreateAchievementDto,
  AchievementDto,
  UpdateAchievementDto,
} from "@/types/api";

/** Achievements own a badge image, so their write contract is `multipart/form-data`. */
export const achievementService = createWriteService<
  AchievementDto,
  CreateAchievementDto,
  UpdateAchievementDto
>("Achievements", "form");