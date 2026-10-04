import { createWriteService } from "@/services/crud";
import type { CreateSocialLinkDto, SocialLinkDto, UpdateSocialLinkDto } from "@/types/api";

/** Social links own a platform icon, so their write contract is `multipart/form-data`. */
export const socialLinkService = createWriteService<
  SocialLinkDto,
  CreateSocialLinkDto,
  UpdateSocialLinkDto
>("SocialLinks", "form");