/**
 * The one place the frontend talks to the backend.
 *
 * Every entity the API exposes has a service here, and each service states the transport its
 * controller actually binds (`"form"` for anything that owns an upload, `"json"` for plain
 * reference data). Components and pages never call `apiClient` or build a URL themselves — they
 * pick a service, so an endpoint change lands in exactly one file.
 */
export { createReadService, createWriteService, stripEmpty } from "@/services/crud";
export type { ReadService, WriteService, WriteTransport } from "@/services/crud";

export { achievementService } from "@/services/achievementService";
export { authService } from "@/services/authService";
export { blogPostService } from "@/services/blogPostService";
export { certificationService } from "@/services/certificationService";
export { categoryService } from "@/services/categoryService";
export { contactService } from "@/services/contactService";
export { educationService } from "@/services/educationService";
export { experienceService } from "@/services/experienceService";
export { profileService } from "@/services/profileService";
export { projectService } from "@/services/projectService";
export { projectImageService } from "@/services/projectImageService";
export { resumeService } from "@/services/resumeService";
export { serviceService } from "@/services/serviceService";
export { skillService } from "@/services/skillService";
export { socialLinkService } from "@/services/socialLinkService";
export { tagService } from "@/services/tagService";
export { technologyService } from "@/services/technologyService";
export { typeService } from "@/services/typeService";

export type {
  AchievementDto,
  AuthResponseDto,
  BlogPostDto,
  CategoryDto,
  CertificationDto,
  ContactMessageDto,
  CreateAchievementDto,
  CreateBlogPostDto,
  CreateCategoryDto,
  CreateCertificationDto,
  CreateContactMessageDto,
  CreateEducationDto,
  CreateExperienceDto,
  CreateProfileDto,
  CreateProjectDto,
  CreateProjectImageDto,
  CreateResumeDto,
  CreateServiceDto,
  CreateSkillDto,
  CreateSocialLinkDto,
  CreateTagDto,
  CreateTechnologyDto,
  CreateTypeDto,
  EducationDto,
  ExperienceDto,
  LoginRequestDto,
  PaginationResult,
  ProfileDto,
  ProjectDto,
  ProjectImageDto,
  QueryParameters,
  ResumeDto,
  ServiceDto,
  SkillDto,
  SocialLinkDto,
  TagDto,
  TechnologyDto,
  TypeDto,
  UpdateAchievementDto,
  UpdateBlogPostDto,
  UpdateCategoryDto,
  UpdateCertificationDto,
  UpdateContactMessageDto,
  UpdateEducationDto,
  UpdateExperienceDto,
  UpdateProfileDto,
  UpdateProjectDto,
  UpdateProjectImageDto,
  UpdateResumeDto,
  UpdateServiceDto,
  UpdateSkillDto,
  UpdateSocialLinkDto,
  UpdateTagDto,
  UpdateTechnologyDto,
  UpdateTypeDto,
} from "@/types/api";