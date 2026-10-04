import { apiClient } from "@/lib/apiClient";
import { createWriteService } from "@/services/crud";
import type { CreateProjectDto, ProjectDto, UpdateProjectDto } from "@/types/api";

const base = createWriteService<ProjectDto, CreateProjectDto, UpdateProjectDto>("Projects", "form");

/**
 * Projects own a cover image and carry three many-to-many relations, so the write contract is
 * `multipart/form-data`. `categoryIds`, `tagIds` and `technologyIds` are sent as repeated fields,
 * which is how ASP.NET binds a `List<int>` from a form; the backend replaces the whole assignment.
 */
export const projectService = {
  ...base,

  /** GET /Projects/featured — returns a bare array, not a pagination envelope. */
  featured(signal?: AbortSignal): Promise<ProjectDto[]> {
    return apiClient.get<ProjectDto[]>("/Projects/featured", signal);
  },
};