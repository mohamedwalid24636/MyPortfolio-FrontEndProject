import { createWriteService } from "@/services/crud";
import type {
  CreateTechnologyDto,
  TechnologyDto,
  UpdateTechnologyDto,
} from "@/types/api";

/** Technologies own an icon, so their write contract is `multipart/form-data`. */
export const technologyService = createWriteService<
  TechnologyDto,
  CreateTechnologyDto,
  UpdateTechnologyDto
>("Technologies", "form");