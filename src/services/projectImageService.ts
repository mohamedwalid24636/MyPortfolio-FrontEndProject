import { createWriteService } from "@/services/crud";
import type { CreateProjectImageDto, ProjectImageDto, UpdateProjectImageDto } from "@/types/api";

/**
 * Gallery images. Each row owns its file, so create/update are `multipart/form-data` with the bytes
 * under `image` and `isDelete` to retire the stored one. `imageUrl` is server-generated.
 */
export const projectImageService = createWriteService<
  ProjectImageDto,
  CreateProjectImageDto,
  UpdateProjectImageDto
>("ProjectImages", "form");