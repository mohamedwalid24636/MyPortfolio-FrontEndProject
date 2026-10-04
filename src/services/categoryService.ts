import { createWriteService } from "@/services/crud";
import type { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "@/types/api";

/**
 * Project categories are plain reference data — the write DTO holds no `IFormFile`, so the
 * controller binds them from the JSON body.
 */
export const categoryService = createWriteService<CategoryDto, CreateCategoryDto, UpdateCategoryDto>(
  "Categories",
  "json",
);