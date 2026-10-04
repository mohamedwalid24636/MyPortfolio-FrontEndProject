import { apiClient } from "@/lib/apiClient";
import { createWriteService } from "@/services/crud";
import type { CreateResumeDto, ResumeDto, UpdateResumeDto } from "@/types/api";

const base = createWriteService<ResumeDto, CreateResumeDto, UpdateResumeDto>("Resumes", "form");

/**
 * The document itself is uploaded: `file` carries the bytes and `isDelete` retires the stored one.
 * `fileUrl`, `fileName`, `fileType` and `uploadedAt` are all derived server-side from the upload,
 * so the client never sends or edits them. `isActive` is honoured by the backend, which stands
 * down any previously active resume when a new one is activated.
 */
export const resumeService = {
  ...base,

  /**
   * GET /Resumes/active — the backend answers 404 when nothing is flagged active,
   * which is treated as "no active resume" rather than an error.
   */
  async active(signal?: AbortSignal): Promise<ResumeDto | null> {
    try {
      return await apiClient.get<ResumeDto>("/Resumes/active", signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      return null;
    }
  },
};