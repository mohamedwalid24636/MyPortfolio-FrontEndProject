import { createWriteService } from "@/services/crud";
import type { CreateServiceDto, ServiceDto, UpdateServiceDto } from "@/types/api";

/** Services own an icon, so their write contract is `multipart/form-data`. */
export const serviceService = createWriteService<
  ServiceDto,
  CreateServiceDto,
  UpdateServiceDto
>("Services", "form");