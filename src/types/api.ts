/**
 * TypeScript contracts mirroring the backend DTOs (Shared/DTOs).
 * All JSON is camelCase because the API uses default ASP.NET Core serialization.
 *
 * Notes on faithfulness to the API:
 *  - `ProjectImageDto.displayOrder` is a string, while `ServiceDto.displayOrder` is a number.
 *  - Read DTOs expose nested objects; write DTOs accept flat id arrays.
 *  - `date` fields are ISO 8601 strings, nullable where the backend is nullable.
 *  - Every write endpoint that owns an upload is `multipart/form-data`. Those write contracts
 *    therefore carry the raw file plus an `isDelete` flag instead of a URL, because the server
 *    decides the folder, the stored name and the URL it hands back on read.
 */

/**
 * The bytes to store, sent under the entity's file field name. `File` from an <input type=file>
 * is a `Blob`, so a picked file can be passed straight through.
 */
export type UploadField = Blob | null | undefined;

/*
 * Attachment write convention (mirrors the backend `IFormFile?` + `IsDelete` pair):
 *  - leave the file field empty to keep the stored attachment,
 *  - set `isDelete: true` to drop it,
 *  - set both to remove the old file first and store the replacement.
 * The file field name is the entity's own (profile `image`, service `icon`, resume `file`, ...).
 */

export interface PaginationResult<T> {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  /** Computed server-side from totalCount/pageSize. */
  totalPages: number;
  data: T[];
}

export interface QueryParameters {
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

/* ------------------------------------------------------------------ Profile */
export interface ProfileDto {
  id: number;
  fullName: string;
  professionalTitle: string;
  bio: string;
  profileImageUrl: string;
  aboutImageUrl: string;
  location: string;
  phone: string;
  email: string;
  yearsOfExperience: number;
}
export interface CreateProfileDto {
  fullName: string;
  professionalTitle: string;
  bio: string;
  location: string;
  phone: string;
  email: string;
  yearsOfExperience: number;
  image?: UploadField;
  aboutImage?: UploadField;
  isDelete?: boolean;
  isDeleteAboutImage?: boolean;
}
export type UpdateProfileDto = CreateProfileDto;

/* ------------------------------------------------------------------ Project */
export interface ProjectImageDto {
  id: number;
  caption: string;
  imageUrl: string;
  /** string (not number) in the backend */
  displayOrder: string;
  projectId: number;
}
export interface CreateProjectImageDto {
  caption: string;
  displayOrder: string;
  projectId: number;
  image?: UploadField;
  isDelete?: boolean;
}
export type UpdateProjectImageDto = CreateProjectImageDto;

export interface TagDto {
  id: number;
  name: string;
  slug: string;
}
export type CreateTagDto = Omit<TagDto, "id">;
export type UpdateTagDto = Omit<TagDto, "id">;

export interface CategoryDto {
  id: number;
  name: string;
  description: string;
  slug: string;
}
export type CreateCategoryDto = Omit<CategoryDto, "id">;
export type UpdateCategoryDto = Omit<CategoryDto, "id">;

export interface TechnologyDto {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  /** free-text grouping label, not a foreign key */
  category: string;
}
export interface CreateTechnologyDto {
  name: string;
  description: string;
  category: string;
  icon?: UploadField;
  isDelete?: boolean;
}
export type UpdateTechnologyDto = CreateTechnologyDto;

export interface ProjectDto {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  githubUrl: string;
  liveDemoUrl: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProjectImageDto[];
  tags: TagDto[];
  categories: CategoryDto[];
  technologies: TechnologyDto[];
}

export interface CreateProjectDto {
  title: string;
  description: string;
  shortDescription: string;
  githubUrl: string;
  liveDemoUrl: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  featured: boolean;
  categoryIds: number[];
  tagIds: number[];
  technologyIds: number[];
  image?: UploadField;
  isDelete?: boolean;
}
export type UpdateProjectDto = CreateProjectDto;

/* ------------------------------------------------------------------- Skill */
export interface TypeDto {
  id: number;
  name: string;
  description: string;
}
export type CreateTypeDto = Omit<TypeDto, "id">;
export type UpdateTypeDto = Omit<TypeDto, "id">;

export interface SkillDto {
  id: number;
  name: string;
  description: string;
  /** string in the backend (e.g. "Advanced", "80%") */
  proficiencyLevel: string;
  iconUrl: string;
  types: TypeDto[];
}

export interface CreateSkillDto {
  name: string;
  description: string;
  proficiencyLevel: string;
  typeIds: number[];
  icon?: UploadField;
  isDelete?: boolean;
}
export type UpdateSkillDto = CreateSkillDto;

/* ----------------------------------------------------------------- Service */
export interface ServiceDto {
  id: number;
  title: string;
  description: string;
  /** number here (unlike ProjectImage.displayOrder) */
  displayOrder: number;
  iconUrl: string;
  isActive: boolean;
}
export interface CreateServiceDto {
  title: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  icon?: UploadField;
  isDelete?: boolean;
}
export type UpdateServiceDto = CreateServiceDto;

/* ----------------------------------------------- Experience & education etc. */
export interface ExperienceDto {
  id: number;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  location: string;
  employmentType: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}
export interface CreateExperienceDto {
  jobTitle: string;
  companyName: string;
  location: string;
  employmentType: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  companyLogo?: UploadField;
  isDelete?: boolean;
}
export type UpdateExperienceDto = CreateExperienceDto;

export interface EducationDto {
  id: number;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  institutionLogoUrl: string;
}
export interface CreateEducationDto {
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  institutionLogo?: UploadField;
  isDelete?: boolean;
}
export type UpdateEducationDto = CreateEducationDto;

export interface CertificationDto {
  id: number;
  name: string;
  issuingOrganization: string;
  credentialId: string;
  credentialUrl: string;
  issueDate: string | null;
  expirationDate: string | null;
  doesNotExpire: boolean;
  certificateUrl: string;
}
export interface CreateCertificationDto {
  name: string;
  issuingOrganization: string;
  credentialId: string;
  credentialUrl: string;
  issueDate: string | null;
  expirationDate: string | null;
  doesNotExpire: boolean;
  certificate?: UploadField;
  isDelete?: boolean;
}
export type UpdateCertificationDto = CreateCertificationDto;

export interface AchievementDto {
  id: number;
  title: string;
  description: string;
  date: string | null;
  imageUrl: string;
  url: string;
}
export interface CreateAchievementDto {
  title: string;
  description: string;
  date: string | null;
  url: string;
  image?: UploadField;
  isDelete?: boolean;
}
export type UpdateAchievementDto = CreateAchievementDto;

export interface SocialLinkDto {
  id: number;
  platform: string;
  username: string;
  url: string;
  iconUrl: string;
}
export interface CreateSocialLinkDto {
  platform: string;
  username: string;
  url: string;
  icon?: UploadField;
  isDelete?: boolean;
}
export type UpdateSocialLinkDto = CreateSocialLinkDto;

/* ------------------------------------------------------------ Contact form */
export interface ContactMessageDto {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface CreateContactMessageDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface UpdateContactMessageDto {
  subject: string;
  message: string;
  isRead: boolean;
}

/* ------------------------------------------------------------------ Resume */
export interface ResumeDto {
  id: number;
  title: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  isActive: boolean;
}
export interface CreateResumeDto {
  title: string;
  isActive: boolean;
  file?: UploadField;
  isDelete?: boolean;
}
export type UpdateResumeDto = CreateResumeDto;

/* ---------------------------------------------------------------- BlogPost */
export interface BlogPostDto {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  coverImageUrl: string;
  publishedAt: string | null;
  updatedAt: string | null;
  status: string;
  readingTime: number;
}
export interface CreateBlogPostDto {
  title: string;
  shortDescription: string;
  content: string;
  status: string;
  coverImage?: UploadField;
  isDelete?: boolean;
}
export type UpdateBlogPostDto = CreateBlogPostDto;

/* ---------------------------------------------------------------------- Auth */
export interface LoginRequestDto {
  email: string;
  password: string;
}
export interface AuthResponseDto {
  /** Sent back as `Authorization: Bearer <token>` on every protected request. */
  token: string;
  /** ISO 8601 instant after which the server stops accepting the token. */
  expiresAtUtc: string;
  email: string;
}
