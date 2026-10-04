import { createWriteService } from "@/services/crud";
import type {
  CertificationDto,
  CreateCertificationDto,
  UpdateCertificationDto,
} from "@/types/api";

/**
 * Certifications own a certificate document, so their write contract is `multipart/form-data`
 * (`certificate` + `isDelete`). `certificateUrl` is server-generated.
 */
export const certificationService = createWriteService<
  CertificationDto,
  CreateCertificationDto,
  UpdateCertificationDto
>("Certifications", "form");