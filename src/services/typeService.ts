import { createWriteService } from "@/services/crud";
import type { CreateTypeDto, TypeDto, UpdateTypeDto } from "@/types/api";

/**
 * Skill types are plain reference data — the write DTO holds no `IFormFile`, so the controller
 * binds them from the JSON body.
 */
export const typeService = createWriteService<TypeDto, CreateTypeDto, UpdateTypeDto>("Types", "json");