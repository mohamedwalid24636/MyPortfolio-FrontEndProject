import { createWriteService } from "@/services/crud";
import type { CreateProfileDto, ProfileDto, UpdateProfileDto } from "@/types/api";

/**
 * The profile owns an image, so its write contract is `multipart/form-data`: the picture travels
 * as `image` and `isDelete` retires the stored one. `profileImageUrl` is never sent by the client —
 * the server decides the folder, the stored name and the URL it hands back.
 */
export const profileService = createWriteService<ProfileDto, CreateProfileDto, UpdateProfileDto>(
  "Profiles",
  "form",
);