import { createWriteService } from "@/services/crud";
import type { CreateTagDto, TagDto, UpdateTagDto } from "@/types/api";

/** Project tags are plain reference data — the controller binds them from the JSON body. */
export const tagService = createWriteService<TagDto, CreateTagDto, UpdateTagDto>("Tags", "json");