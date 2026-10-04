import { apiClient } from "@/lib/apiClient";
import { createWriteService } from "@/services/crud";
import type { ContactMessageDto, CreateContactMessageDto, UpdateContactMessageDto } from "@/types/api";

const base = createWriteService<
  ContactMessageDto,
  CreateContactMessageDto,
  UpdateContactMessageDto
>("ContactMessages", "json");

/**
 * Contact messages carry no attachment, so the controller binds them from the JSON body.
 * `sentAt` is server-set and cannot be supplied by the client.
 */
export const contactService = {
  ...base,

  /** PATCH /ContactMessages/{id}/read — flips `isRead` without touching the content. */
  async markAsRead(id: number, signal?: AbortSignal): Promise<void> {
    await apiClient.patch<void>(`/ContactMessages/${id}/read`, undefined, signal);
  },
};