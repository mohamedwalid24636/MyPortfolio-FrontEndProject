import type { ReactNode } from "react";
import { MailCheck } from "lucide-react";
import {
  categoryService,
  certificationService,
  contactService,
  educationService,
  experienceService,
  profileService,
  projectService,
  resumeService,
  serviceService,
  skillService,
  socialLinkService,
  tagService,
  technologyService,
  typeService,
  blogPostService,
  achievementService,
} from "@/services";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { formatDateRange, formatFullDate, formatMonthYear } from "@/lib/format";
import { hasLink, resolveImageUrl } from "@/lib/media";
import type {
  AchievementDto,
  BlogPostDto,
  CategoryDto,
  CertificationDto,
  ContactMessageDto,
  EducationDto,
  ExperienceDto,
  PaginationResult,
  ProfileDto,
  ProjectDto,
  QueryParameters,
  ResumeDto,
  ServiceDto,
  SkillDto,
  SocialLinkDto,
  TagDto,
  TechnologyDto,
  TypeDto,
} from "@/types/api";
import { EMPTY_FILE_VALUE, type FileFieldValue } from "@/components/admin/FormFields";

/* ========================================================================== *
 * Declarative admin schema
 *
 * Every backend resource is described once here: how a row looks in the table, which fields the
 * form shows, and how those form values become the exact payload that resource's controller binds.
 * The admin pages themselves are generic — they render whatever a spec says. That keeps 17
 * resources maintainable without 17 near-identical page components drifting apart.
 * ========================================================================== */

export interface Option {
  value: string | number;
  label: string;
}

export type FieldKind =
  | "text"
  | "email"
  | "url"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "toggle"
  | "multiselect"
  | "file";

interface FieldBase {
  /** Property name on the write DTO. */
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** Renders full width. Use for long text and multi-selects. */
  wide?: boolean;
  /** Sends an explicit `null` when cleared, instead of omitting the property. */
  nullable?: boolean;
  /** Derives the value from another field as it is typed (slug-style). */
  slugFrom?: string;
  /** Hide while its parent switch is off. */
  visibleWhen?: (values: FormValues) => boolean;
}

export interface TextLikeField extends FieldBase {
  kind: "text" | "email" | "url" | "textarea" | "date" | "number" | "select";
  options?: Option[];
  rows?: number;
  min?: number;
  max?: number;
  /** Resolve this select's options from a loaded relation instead of `options`. */
  relation?: string;
}

export interface ToggleFieldSpec extends FieldBase {
  kind: "toggle";
}

export interface MultiSelectFieldSpec extends FieldBase {
  kind: "multiselect";
  /** Key into the spec's `relations`. */
  relation: string;
  emptyLabel?: string;
}

export interface FileFieldSpec extends FieldBase {
  kind: "file";
  /** Multipart field name the controller binds, e.g. `image`. */
  uploadField: string;
  /** Read-DTO property holding the URL the server currently serves, e.g. `imageUrl`. */
  urlField: string;
  /** Optional DTO field used when this attachment is removed. */
  deleteField?: string;
  accept?: string;
  fileKind?: "image" | "document";
}

export type FieldSpec = TextLikeField | ToggleFieldSpec | MultiSelectFieldSpec | FileFieldSpec;

/** A lookup list loaded for a multi-select. */
export interface RelationSpec {
  key: string;
  load: (signal: AbortSignal) => Promise<Option[]>;
}

export interface ColumnSpec<TDto> {
  key: string;
  header: string;
  render: (dto: TDto) => ReactNode;
  /** Hidden on narrow screens. */
  secondary?: boolean;
}

export type FormValues = Record<string, unknown>;
export type FormFiles = Record<string, FileFieldValue>;

/**
 * The subset of a service the admin needs. Declared with method syntax so a
 * fully-typed `WriteService<ProjectDto, CreateProjectDto, …>` stays assignable.
 */
export interface ResourceService {
  list(params?: QueryParameters, signal?: AbortSignal): Promise<PaginationResult<unknown>>;
  create(payload: unknown, signal?: AbortSignal): Promise<unknown>;
  update(id: number, payload: unknown, signal?: AbortSignal): Promise<void>;
  remove(id: number, signal?: AbortSignal): Promise<void>;
}

export interface ResourceSpec<TDto> {
  /** URL segment under /admin. */
  key: string;
  /** Backend route this resource lives on, e.g. `SocialLinks`. */
  endpoint: string;
  singular: string;
  plural: string;
  /** One line explaining what this resource controls. */
  description: string;
  service: ResourceService;
  columns: ColumnSpec<TDto>[];
  fields: FieldSpec[];
  relations?: RelationSpec[];
  /** Seed values for a new record. */
  defaults?: () => FormValues;
  /** Extracts form values from an existing row. */
  fromDto?: (dto: TDto) => FormValues;
  /** Repairs nullable/missing read-model collections before rows or forms consume them. */
  normalize?: (dto: TDto) => TDto;
  supportsCreate?: boolean;
  supportsDelete?: boolean;
  /** Only one row is expected; the page shows an empty-state CTA instead of a "New" button. */
  singleton?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Hide the search box for resources with too few rows to filter meaningfully. */
  searchable?: boolean;
  /**
   * Optional per-row quick action. `update(changes)` merges the given properties into the row's
   * current payload and sends a normal PUT, so a shortcut never needs its own endpoint.
   */
  rowAction?: (dto: TDto, actions: RowActionContext) => ReactNode;
}

export interface RowActionContext {
  update: (changes: Record<string, unknown>) => void;
  busy: boolean;
}

export type ResourceRegistryEntry = ResourceSpec<never>;

/* ------------------------------------------------------------------ helpers */

/** ISO timestamp -> `yyyy-MM-dd` for `<input type="date">`. */
function toDateInput(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function textOrDash(value: string | null | undefined): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : "—";
}

function Thumbnail({ url, alt }: { url: string | null | undefined; alt: string }) {
  if (!hasLink(url)) {
    return (
      <span className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-ink-850 text-[0.6rem] font-semibold text-fg-subtle">
        n/a
      </span>
    );
  }
  return (
    <img
      src={resolveImageUrl(url)}
      alt={alt}
      loading="lazy"
      className="size-10 shrink-0 rounded-lg border border-white/10 bg-ink-850 object-cover"
    />
  );
}

function Badge({ tone, children }: { tone: "on" | "off" | "accent" | "muted"; children: ReactNode }) {
  const tones: Record<string, string> = {
    on: "border-emerald-400/30 bg-emerald-500/12 text-emerald-200",
    off: "border-white/10 bg-white/[0.04] text-fg-subtle",
    accent: "border-accent-500/30 bg-accent-500/12 text-accent-200",
    muted: "border-white/10 bg-white/[0.04] text-fg-muted",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function LinksCell({ links }: { links: { label: string; href: string }[] }) {
  const usable = links.filter((link) => hasLink(link.href));
  if (usable.length === 0) return <span className="text-fg-subtle">—</span>;

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {usable.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          className="chip-accent hover:border-accent-400/60"
        >
          {link.label}
        </a>
      ))}
    </span>
  );
}

function NameCell({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <span className="block min-w-0">
      <span className="block truncate font-medium text-fg">{textOrDash(title)}</span>
      {subtitle ? <span className="mt-0.5 block truncate text-xs text-fg-subtle">{subtitle}</span> : null}
    </span>
  );
}

/** Trims long free text so one row never blows up the table. */
function Excerpt({ value, length = 90 }: { value: string | null | undefined; length?: number }) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) return <span className="text-fg-subtle">—</span>;
  return <span className="text-fg-muted">{text.length > length ? `${text.slice(0, length)}…` : text}</span>;
}

const STATUS_OPTIONS: Option[] = [
  { value: "Completed", label: "Completed" },
  { value: "In Progress", label: "In Progress" },
  { value: "On Hold", label: "On Hold" },
  { value: "Planned", label: "Planned" },
];

const EMPLOYMENT_TYPES: Option[] = [
  { value: "Full Time", label: "Full Time" },
  { value: "Part Time", label: "Part Time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
  { value: "Freelance", label: "Freelance" },
];

const BLOG_STATUSES: Option[] = [
  { value: "Draft", label: "Draft" },
  { value: "Published", label: "Published" },
  { value: "Archived", label: "Archived" },
];

const SOCIAL_PLATFORMS: Option[] = [
  { value: "GitHub", label: "GitHub" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "X", label: "X (Twitter)" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "YouTube", label: "YouTube" },
  { value: "Dribbble", label: "Dribbble" },
  { value: "Behance", label: "Behance" },
  { value: "Medium", label: "Medium" },
  { value: "DevTo", label: "Dev.to" },
  { value: "Email", label: "Email" },
];

/* ---------------------------------------------------------------- relations */

async function loadRelation<T extends { id: number }>(
  service: { list(params?: QueryParameters, signal?: AbortSignal): Promise<PaginationResult<T>> },
  signal: AbortSignal,
  label: (dto: T) => string,
): Promise<Option[]> {
  const result = await service.list({ pageSize: MAX_PAGE_SIZE }, signal);
  return (result?.data ?? [])
    .map((dto) => ({ value: dto.id, label: label(dto) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const CATEGORY_RELATION: RelationSpec = {
  key: "categories",
  load: (signal) => loadRelation(categoryService, signal, (dto: CategoryDto) => dto.name),
};

const TAG_RELATION: RelationSpec = {
  key: "tags",
  load: (signal) => loadRelation(tagService, signal, (dto: TagDto) => dto.name),
};

const TECHNOLOGY_RELATION: RelationSpec = {
  key: "technologies",
  load: (signal) => loadRelation(technologyService, signal, (dto: TechnologyDto) => dto.name),
};

const TYPE_RELATION: RelationSpec = {
  key: "types",
  load: (signal) => loadRelation(typeService, signal, (dto: TypeDto) => dto.name),
};

/* ------------------------------------------------------------------ profile */

const profileSpec: ResourceSpec<ProfileDto> = {
  key: "profile",
  endpoint: "Profiles",
  singular: "Profile",
  plural: "Profile",
  description: "The identity block shown in the hero, about section and every page footer.",
  service: profileService,
  singleton: true,
  searchable: false,
  supportsDelete: false,
  columns: [
    { key: "name", header: "Name", render: (dto) => <NameCell title={dto.fullName} subtitle={dto.professionalTitle} /> },
    { key: "contact", header: "Contact", render: (dto) => <Excerpt value={[dto.email, dto.phone].filter(Boolean).join(" · ")} /> },
    { key: "location", header: "Location", secondary: true, render: (dto) => <Excerpt value={dto.location} /> },
    {
      key: "experience",
      header: "Experience",
      secondary: true,
      render: (dto) => <Badge tone="accent">{dto.yearsOfExperience} yrs</Badge>,
    },
    { key: "image", header: "Photo", secondary: true, render: (dto) => <Thumbnail url={dto.profileImageUrl} alt="" /> },
  ],
  fields: [
    { name: "fullName", label: "Full name", kind: "text", required: true, placeholder: "Your name" },
    { name: "professionalTitle", label: "Professional title", kind: "text", required: true, placeholder: "e.g. Backend Developer" },
    { name: "email", label: "Email", kind: "email", required: true, placeholder: "you@example.com" },
    { name: "phone", label: "Phone", kind: "text", placeholder: "+20 …" },
    { name: "location", label: "Location", kind: "text", placeholder: "City, Country" },
    { name: "yearsOfExperience", label: "Years of experience", kind: "number", min: 0, max: 60 },
    {
      name: "bio",
      label: "Bio",
      kind: "textarea",
      required: true,
      wide: true,
      rows: 6,
      placeholder: "A short introduction used on the resume and about sections.",
    },
    {
      name: "image",
      label: "Profile photo",
      kind: "file",
      uploadField: "image",
      urlField: "profileImageUrl",
      wide: true,
    },
    {
      name: "aboutImage",
      label: "About section photo",
      kind: "file",
      uploadField: "aboutImage",
      urlField: "aboutImageUrl",
      deleteField: "isDeleteAboutImage",
      wide: true,
    },
  ],
  fromDto: (dto) => ({
    fullName: dto.fullName ?? "",
    professionalTitle: dto.professionalTitle ?? "",
    email: dto.email ?? "",
    phone: dto.phone ?? "",
    location: dto.location ?? "",
    yearsOfExperience: dto.yearsOfExperience ?? 0,
    bio: dto.bio ?? "",
  }),
};

/* ----------------------------------------------------------------- projects */

const projectSpec: ResourceSpec<ProjectDto> = {
  key: "projects",
  endpoint: "Projects",
  singular: "Project",
  plural: "Projects",
  description: "Case studies on the home page, the projects listing and the detail pages.",
  service: projectService,
  normalize: (dto) => ({
    ...dto,
    categories: dto.categories ?? [],
    tags: dto.tags ?? [],
    technologies: dto.technologies ?? [],
    images: dto.images ?? [],
  }),
  relations: [CATEGORY_RELATION, TAG_RELATION, TECHNOLOGY_RELATION],
  searchPlaceholder: "Search titles and descriptions…",
  columns: [
    {
      key: "title",
      header: "Project",
      render: (dto) => <NameCell title={dto.title} subtitle={dto.shortDescription} />,
    },
    {
      key: "cover",
      header: "Cover",
      secondary: true,
      render: (dto) => <Thumbnail url={dto.imageUrl} alt="" />,
    },
    {
      key: "status",
      header: "Status",
      render: (dto) => <Badge tone={dto.status === "Completed" ? "on" : "muted"}>{textOrDash(dto.status)}</Badge>,
    },
    {
      key: "featured",
      header: "Featured",
      render: (dto) => (dto.featured ? <Badge tone="accent">Featured</Badge> : <span className="text-fg-subtle">—</span>),
    },
    {
      key: "dates",
      header: "Timeline",
      secondary: true,
      render: (dto) => <span className="text-fg-muted">{formatDateRange(dto.startDate, dto.endDate)}</span>,
    },
    {
      key: "taxonomy",
      header: "Categories",
      secondary: true,
      render: (dto) =>
        dto.categories.length > 0 ? (
          <span className="inline-flex flex-wrap gap-1">
            {dto.categories.map((category) => (
              <Badge key={category.id} tone="muted">
                {category.name}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-fg-subtle">—</span>
        ),
    },
    {
      key: "links",
      header: "Links",
      secondary: true,
      render: (dto) => (
        <LinksCell
          links={[
            { label: "GitHub", href: dto.githubUrl },
            { label: "Live", href: dto.liveDemoUrl },
          ]}
        />
      ),
    },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "shortDescription", label: "Short description", kind: "text", required: true, wide: true, placeholder: "One line shown on cards" },
    { name: "description", label: "Full description", kind: "textarea", required: true, wide: true, rows: 8 },
    { name: "status", label: "Status", kind: "select", required: true, options: STATUS_OPTIONS },
    { name: "featured", label: "Show on the home page", kind: "toggle" },
    { name: "startDate", label: "Start date", kind: "date", nullable: true },
    { name: "endDate", label: "End date", kind: "date", nullable: true },
    { name: "githubUrl", label: "Repository URL", kind: "url", placeholder: "https://github.com/…" },
    { name: "liveDemoUrl", label: "Live demo URL", kind: "url", placeholder: "https://…" },
    {
      name: "image",
      label: "Cover image",
      kind: "file",
      uploadField: "image",
      urlField: "imageUrl",
      wide: true,
    },
    { name: "categoryIds", label: "Categories", kind: "multiselect", relation: "categories", wide: true },
    { name: "tagIds", label: "Tags", kind: "multiselect", relation: "tags", wide: true },
    { name: "technologyIds", label: "Technologies", kind: "multiselect", relation: "technologies", wide: true },
  ],
  defaults: () => ({
    title: "",
    shortDescription: "",
    description: "",
    status: "Completed",
    featured: false,
    startDate: "",
    endDate: "",
    githubUrl: "",
    liveDemoUrl: "",
    categoryIds: [],
    tagIds: [],
    technologyIds: [],
  }),
  fromDto: (dto) => ({
    title: dto.title ?? "",
    shortDescription: dto.shortDescription ?? "",
    description: dto.description ?? "",
    status: dto.status ?? "",
    featured: Boolean(dto.featured),
    startDate: toDateInput(dto.startDate),
    endDate: toDateInput(dto.endDate),
    githubUrl: dto.githubUrl ?? "",
    liveDemoUrl: dto.liveDemoUrl ?? "",
    categoryIds: dto.categories.map((category) => category.id),
    tagIds: dto.tags.map((tag) => tag.id),
    technologyIds: dto.technologies.map((technology) => technology.id),
  }),
};

/* --------------------------------------------------------- reference tables */

const tagSpec: ResourceSpec<TagDto> = {
  key: "tags",
  endpoint: "Tags",
  singular: "Tag",
  plural: "Tags",
  description: "Keywords attached to projects.",
  service: tagService,
  searchable: false,
  columns: [
    { key: "name", header: "Name", render: (dto) => <NameCell title={dto.name} /> },
    { key: "slug", header: "Slug", secondary: true, render: (dto) => <span className="font-mono text-xs text-fg-subtle">{dto.slug}</span> },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "text", slugFrom: "name" },
  ],
  defaults: () => ({ name: "", slug: "" }),
  fromDto: (dto) => ({ name: dto.name ?? "", slug: dto.slug ?? "" }),
};

const categorySpec: ResourceSpec<CategoryDto> = {
  key: "categories",
  endpoint: "Categories",
  singular: "Category",
  plural: "Categories",
  description: "Groupings used to filter projects.",
  service: categoryService,
  searchable: false,
  columns: [
    { key: "name", header: "Name", render: (dto) => <NameCell title={dto.name} /> },
    { key: "slug", header: "Slug", secondary: true, render: (dto) => <span className="font-mono text-xs text-fg-subtle">{dto.slug}</span> },
    { key: "description", header: "Description", secondary: true, render: (dto) => <Excerpt value={dto.description} /> },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text" },
    { name: "slug", label: "Slug", kind: "text", slugFrom: "name" },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 3 },
  ],
  defaults: () => ({ name: "", slug: "", description: "" }),
  fromDto: (dto) => ({ name: dto.name ?? "", slug: dto.slug ?? "", description: dto.description ?? "" }),
};

const typeSpec: ResourceSpec<TypeDto> = {
  key: "skill-types",
  endpoint: "Types",
  singular: "Skill type",
  plural: "Skill types",
  description: "Categories used to group skills, e.g. “Backend”, “Data”.",
  service: typeService,
  searchable: false,
  columns: [
    { key: "name", header: "Name", render: (dto) => <NameCell title={dto.name} /> },
    { key: "description", header: "Description", secondary: true, render: (dto) => <Excerpt value={dto.description} /> },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text" },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 3 },
  ],
  defaults: () => ({ name: "", description: "" }),
  fromDto: (dto) => ({ name: dto.name ?? "", description: dto.description ?? "" }),
};

const technologySpec: ResourceSpec<TechnologyDto> = {
  key: "technologies",
  endpoint: "Technologies",
  singular: "Technology",
  plural: "Technologies",
  description: "The stack used across projects, including each icon.",
  service: technologyService,
  searchable: true,
  searchPlaceholder: "Search technologies…",
  columns: [
    {
      key: "name",
      header: "Technology",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.iconUrl} alt="" />
          <NameCell title={dto.name} subtitle={dto.description} />
        </span>
      ),
    },
    { key: "category", header: "Group", render: (dto) => <Badge tone="muted">{textOrDash(dto.category)}</Badge> },
    {
      key: "description",
      header: "Description",
      secondary: true,
      render: (dto) => <Excerpt value={dto.description} />,
    },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true, placeholder: "e.g. PostgreSQL" },
    { name: "category", label: "Group", kind: "text", placeholder: "e.g. Database" },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 3 },
    { name: "icon", label: "Icon", kind: "file", uploadField: "icon", urlField: "iconUrl", wide: true },
  ],
  defaults: () => ({ name: "", category: "", description: "" }),
  fromDto: (dto) => ({ name: dto.name ?? "", category: dto.category ?? "", description: dto.description ?? "" }),
};

/* ------------------------------------------------------------- skills, etc. */

const skillSpec: ResourceSpec<SkillDto> = {
  key: "skills",
  endpoint: "Skills",
  singular: "Skill",
  plural: "Skills",
  description: "The skills grid, including proficiency and grouping.",
  service: skillService,
  normalize: (dto) => ({ ...dto, types: dto.types ?? [] }),
  relations: [TYPE_RELATION],
  searchable: true,
  searchPlaceholder: "Search skills…",
  columns: [
    {
      key: "name",
      header: "Skill",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.iconUrl} alt="" />
          <NameCell title={dto.name} subtitle={dto.description} />
        </span>
      ),
    },
    {
      key: "level",
      header: "Proficiency",
      render: (dto) => <Badge tone="accent">{textOrDash(dto.proficiencyLevel)}</Badge>,
    },
    {
      key: "types",
      header: "Types",
      secondary: true,
      render: (dto) =>
        dto.types.length > 0 ? (
          <span className="inline-flex flex-wrap gap-1">
            {dto.types.map((type) => (
              <Badge key={type.id} tone="muted">
                {type.name}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-fg-subtle">—</span>
        ),
    },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    {
      name: "proficiencyLevel",
      label: "Proficiency level",
      kind: "text",
      required: true,
      hint: "Free text, e.g. “Advanced” or “80%”.",
    },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 3 },
    { name: "icon", label: "Icon", kind: "file", uploadField: "icon", urlField: "iconUrl", wide: true },
    { name: "typeIds", label: "Skill types", kind: "multiselect", relation: "types", wide: true },
  ],
  defaults: () => ({ name: "", proficiencyLevel: "", description: "", typeIds: [] }),
  fromDto: (dto) => ({
    name: dto.name ?? "",
    proficiencyLevel: dto.proficiencyLevel ?? "",
    description: dto.description ?? "",
    typeIds: dto.types.map((type) => type.id),
  }),
};

const serviceSpec: ResourceSpec<ServiceDto> = {
  key: "services",
  endpoint: "Services",
  singular: "Service",
  plural: "Services",
  description: "The “What I do” cards and their order.",
  service: serviceService,
  searchable: false,
  columns: [
    {
      key: "title",
      header: "Service",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.iconUrl} alt="" />
          <NameCell title={dto.title} subtitle={dto.description} />
        </span>
      ),
    },
    { key: "order", header: "Order", render: (dto) => <Badge tone="muted">{dto.displayOrder}</Badge> },
    {
      key: "active",
      header: "Visible",
      render: (dto) => <Badge tone={dto.isActive ? "on" : "off"}>{dto.isActive ? "Visible" : "Hidden"}</Badge>,
    },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "displayOrder", label: "Display order", kind: "number", min: 0 },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 4 },
    { name: "isActive", label: "Visible on the site", kind: "toggle" },
    { name: "icon", label: "Icon", kind: "file", uploadField: "icon", urlField: "iconUrl", wide: true },
  ],
  defaults: () => ({ title: "", displayOrder: 0, description: "", isActive: true }),
  fromDto: (dto) => ({
    title: dto.title ?? "",
    displayOrder: dto.displayOrder ?? 0,
    description: dto.description ?? "",
    isActive: Boolean(dto.isActive),
  }),
};

const experienceSpec: ResourceSpec<ExperienceDto> = {
  key: "experience",
  endpoint: "Experiences",
  singular: "Experience",
  plural: "Experience",
  description: "The work history timeline.",
  service: experienceService,
  searchable: false,
  columns: [
    {
      key: "role",
      header: "Role",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.companyLogoUrl} alt="" />
          <NameCell title={dto.jobTitle} subtitle={dto.companyName} />
        </span>
      ),
    },
    { key: "type", header: "Type", render: (dto) => <Badge tone="muted">{textOrDash(dto.employmentType)}</Badge> },
    {
      key: "dates",
      header: "Period",
      secondary: true,
      render: (dto) => <span className="text-fg-muted">{formatDateRange(dto.startDate, dto.endDate, dto.isCurrent)}</span>,
    },
    { key: "location", header: "Location", secondary: true, render: (dto) => <Excerpt value={dto.location} /> },
  ],
  fields: [
    { name: "jobTitle", label: "Job title", kind: "text", required: true },
    { name: "companyName", label: "Company", kind: "text", required: true },
    { name: "employmentType", label: "Employment type", kind: "select", required: true, options: EMPLOYMENT_TYPES },
    { name: "location", label: "Location", kind: "text" },
    { name: "startDate", label: "Start date", kind: "date", nullable: true },
    {
      name: "endDate",
      label: "End date",
      kind: "date",
      nullable: true,
      visibleWhen: (values) => !values.isCurrent,
    },
    { name: "isCurrent", label: "I currently work here", kind: "toggle" },
    { name: "description", label: "Description", kind: "textarea", required: true, wide: true, rows: 6, hint: "One bullet per line." },
    { name: "companyLogo", label: "Company logo", kind: "file", uploadField: "companyLogo", urlField: "companyLogoUrl", wide: true },
  ],
  defaults: () => ({
    jobTitle: "",
    companyName: "",
    employmentType: "Full Time",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  }),
  fromDto: (dto) => ({
    jobTitle: dto.jobTitle ?? "",
    companyName: dto.companyName ?? "",
    employmentType: dto.employmentType ?? "",
    location: dto.location ?? "",
    startDate: toDateInput(dto.startDate),
    endDate: toDateInput(dto.endDate),
    isCurrent: Boolean(dto.isCurrent),
    description: dto.description ?? "",
  }),
};

const educationSpec: ResourceSpec<EducationDto> = {
  key: "education",
  endpoint: "Educations",
  singular: "Education",
  plural: "Education",
  description: "Degrees and institutions shown in the education section.",
  service: educationService,
  searchable: false,
  columns: [
    {
      key: "degree",
      header: "Degree",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.institutionLogoUrl} alt="" />
          <NameCell title={dto.degree} subtitle={dto.institutionName} />
        </span>
      ),
    },
    { key: "field", header: "Field", render: (dto) => <Excerpt value={dto.fieldOfStudy} /> },
    {
      key: "dates",
      header: "Period",
      secondary: true,
      render: (dto) => <span className="text-fg-muted">{formatDateRange(dto.startDate, dto.endDate, dto.isCurrent)}</span>,
    },
  ],
  fields: [
    { name: "institutionName", label: "Institution", kind: "text", required: true },
    { name: "degree", label: "Degree", kind: "text", required: true, placeholder: "e.g. BSc" },
    { name: "fieldOfStudy", label: "Field of study", kind: "text", required: true },
    { name: "startDate", label: "Start date", kind: "date", nullable: true },
    {
      name: "endDate",
      label: "End date",
      kind: "date",
      nullable: true,
      visibleWhen: (values) => !values.isCurrent,
    },
    { name: "isCurrent", label: "Still studying here", kind: "toggle" },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 4 },
    {
      name: "institutionLogo",
      label: "Institution logo",
      kind: "file",
      uploadField: "institutionLogo",
      urlField: "institutionLogoUrl",
      wide: true,
    },
  ],
  defaults: () => ({
    institutionName: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  }),
  fromDto: (dto) => ({
    institutionName: dto.institutionName ?? "",
    degree: dto.degree ?? "",
    fieldOfStudy: dto.fieldOfStudy ?? "",
    startDate: toDateInput(dto.startDate),
    endDate: toDateInput(dto.endDate),
    isCurrent: Boolean(dto.isCurrent),
    description: dto.description ?? "",
  }),
};

const certificationSpec: ResourceSpec<CertificationDto> = {
  key: "certifications",
  endpoint: "Certifications",
  singular: "Certification",
  plural: "Certifications",
  description: "Certificates, credentials and verification links.",
  service: certificationService,
  searchable: false,
  columns: [
    {
      key: "name",
      header: "Certification",
      render: (dto) => <NameCell title={dto.name} subtitle={dto.issuingOrganization} />,
    },
    {
      key: "issued",
      header: "Issued",
      render: (dto) => <span className="text-fg-muted">{formatMonthYear(dto.issueDate) ?? "—"}</span>,
    },
    {
      key: "expires",
      header: "Expires",
      secondary: true,
      render: (dto) =>
        dto.doesNotExpire ? <Badge tone="on">Never</Badge> : <span className="text-fg-muted">{formatMonthYear(dto.expirationDate) ?? "—"}</span>,
    },
    {
      key: "links",
      header: "Links",
      secondary: true,
      render: (dto) => <LinksCell links={[{ label: "Credential", href: dto.credentialUrl }]} />,
    },
  ],
  fields: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "issuingOrganization", label: "Issuing organization", kind: "text", required: true },
    { name: "credentialId", label: "Credential ID", kind: "text" },
    { name: "credentialUrl", label: "Credential URL", kind: "url", placeholder: "https://verify…" },
    { name: "issueDate", label: "Issue date", kind: "date", nullable: true },
    { name: "doesNotExpire", label: "Never expires", kind: "toggle" },
    {
      name: "expirationDate",
      label: "Expiration date",
      kind: "date",
      nullable: true,
      visibleWhen: (values) => !values.doesNotExpire,
    },
    {
      name: "certificate",
      label: "Certificate file",
      kind: "file",
      uploadField: "certificate",
      urlField: "certificateUrl",
      fileKind: "document",
      accept: ".pdf,.jpg,.jpeg,.png,.webp",
      wide: true,
    },
  ],
  defaults: () => ({
    name: "",
    issuingOrganization: "",
    credentialId: "",
    credentialUrl: "",
    issueDate: "",
    doesNotExpire: false,
    expirationDate: "",
  }),
  fromDto: (dto) => ({
    name: dto.name ?? "",
    issuingOrganization: dto.issuingOrganization ?? "",
    credentialId: dto.credentialId ?? "",
    credentialUrl: dto.credentialUrl ?? "",
    issueDate: toDateInput(dto.issueDate),
    doesNotExpire: Boolean(dto.doesNotExpire),
    expirationDate: toDateInput(dto.expirationDate),
  }),
};

const achievementSpec: ResourceSpec<AchievementDto> = {
  key: "achievements",
  endpoint: "Achievements",
  singular: "Achievement",
  plural: "Achievements",
  description: "Awards, certificates of completion and milestones.",
  service: achievementService,
  searchable: false,
  columns: [
    {
      key: "title",
      header: "Achievement",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.imageUrl} alt="" />
          <NameCell title={dto.title} subtitle={dto.description} />
        </span>
      ),
    },
    { key: "date", header: "Date", render: (dto) => <span className="text-fg-muted">{formatFullDate(dto.date) ?? "—"}</span> },
    { key: "link", header: "Link", secondary: true, render: (dto) => <LinksCell links={[{ label: "Open", href: dto.url }]} /> },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "date", label: "Date", kind: "date", nullable: true },
    { name: "url", label: "Link", kind: "url", placeholder: "https://…" },
    { name: "description", label: "Description", kind: "textarea", wide: true, rows: 3 },
    { name: "image", label: "Image", kind: "file", uploadField: "image", urlField: "imageUrl", wide: true },
  ],
  defaults: () => ({ title: "", date: "", url: "", description: "" }),
  fromDto: (dto) => ({ title: dto.title ?? "", date: toDateInput(dto.date), url: dto.url ?? "", description: dto.description ?? "" }),
};

const socialLinkSpec: ResourceSpec<SocialLinkDto> = {
  key: "social-links",
  endpoint: "SocialLinks",
  singular: "Social link",
  plural: "Social links",
  description: "The links in the navbar, footer and contact section.",
  service: socialLinkService,
  searchable: false,
  columns: [
    {
      key: "platform",
      header: "Platform",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.iconUrl} alt="" />
          <NameCell title={dto.platform} subtitle={dto.username} />
        </span>
      ),
    },
    { key: "link", header: "URL", render: (dto) => <LinksCell links={[{ label: "Open", href: dto.url }]} /> },
  ],
  fields: [
    { name: "platform", label: "Platform", kind: "select", options: SOCIAL_PLATFORMS },
    { name: "username", label: "Username", kind: "text", placeholder: "@yourhandle" },
    { name: "url", label: "URL", kind: "url", placeholder: "https://…" },
    { name: "icon", label: "Icon", kind: "file", uploadField: "icon", urlField: "iconUrl", wide: true },
  ],
  defaults: () => ({ platform: "GitHub", username: "", url: "" }),
  fromDto: (dto) => ({ platform: dto.platform ?? "", username: dto.username ?? "", url: dto.url ?? "" }),
};

const resumeSpec: ResourceSpec<ResumeDto> = {
  key: "resumes",
  endpoint: "Resumes",
  singular: "Resume",
  plural: "Resumes",
  description: "Uploadable CV files. Only one can be active at a time.",
  service: resumeService,
  searchable: false,
  columns: [
    {
      key: "title",
      header: "Resume",
      render: (dto) => (
        <NameCell
          title={dto.title}
          subtitle={
            <>
              {dto.fileName} · {dto.fileType || "file"} · uploaded {formatFullDate(dto.uploadedAt) ?? "—"}
            </>
          }
        />
      ),
    },
    {
      key: "active",
      header: "Active",
      render: (dto) => <Badge tone={dto.isActive ? "on" : "off"}>{dto.isActive ? "Downloadable" : "Archived"}</Badge>,
    },
    {
      key: "file",
      header: "File",
      secondary: true,
      render: (dto) => <LinksCell links={[{ label: "Download", href: dto.fileUrl }]} />,
    },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true, placeholder: "e.g. Software Engineer CV" },
    { name: "isActive", label: "Make this the downloadable CV", kind: "toggle" },
    {
      name: "file",
      label: "CV file",
      kind: "file",
      uploadField: "file",
      urlField: "fileUrl",
      fileKind: "document",
      accept: ".pdf,.jpg,.jpeg,.png,.webp",
      wide: true,
      hint: "The public resume page links to whichever file is active.",
    },
  ],
  defaults: () => ({ title: "", isActive: true }),
  fromDto: (dto) => ({ title: dto.title ?? "", isActive: Boolean(dto.isActive) }),
};

/* --------------------------------------------------------------- blog posts */

const blogPostSpec: ResourceSpec<BlogPostDto> = {
  key: "blog",
  endpoint: "BlogPosts",
  singular: "Post",
  plural: "Blog posts",
  description: "Long-form writing. The slug and reading time are generated by the server.",
  service: blogPostService,
  searchable: true,
  searchPlaceholder: "Search titles and content…",
  columns: [
    {
      key: "title",
      header: "Post",
      render: (dto) => (
        <span className="flex items-center gap-3">
          <Thumbnail url={dto.coverImageUrl} alt="" />
          <NameCell title={dto.title} subtitle={dto.shortDescription} />
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (dto) => <Badge tone={dto.status === "Published" ? "on" : "muted"}>{textOrDash(dto.status)}</Badge>,
    },
    {
      key: "slug",
      header: "Slug",
      secondary: true,
      render: (dto) => <span className="font-mono text-xs text-fg-subtle">{dto.slug}</span>,
    },
    {
      key: "published",
      header: "Published",
      secondary: true,
      render: (dto) => <span className="text-fg-muted">{formatFullDate(dto.publishedAt) ?? "—"}</span>,
    },
    {
      key: "reading",
      header: "Read",
      secondary: true,
      render: (dto) => <Badge tone="muted">{dto.readingTime} min</Badge>,
    },
  ],
  fields: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "status", label: "Status", kind: "select", options: BLOG_STATUSES },
    { name: "shortDescription", label: "Short description", kind: "textarea", wide: true, rows: 2 },
    {
      name: "content",
      label: "Content",
      kind: "textarea",
      wide: true,
      rows: 16,
      hint: "Markdown is supported.",
    },
    { name: "coverImage", label: "Cover image", kind: "file", uploadField: "coverImage", urlField: "coverImageUrl", wide: true },
  ],
  defaults: () => ({ title: "", shortDescription: "", content: "", status: "Draft" }),
  fromDto: (dto) => ({
    title: dto.title ?? "",
    shortDescription: dto.shortDescription ?? "",
    content: dto.content ?? "",
    status: dto.status ?? "",
  }),
};

/* ---------------------------------------------------------- contact messages */

const contactMessageSpec: ResourceSpec<ContactMessageDto> = {
  key: "messages",
  endpoint: "ContactMessages",
  singular: "Message",
  plural: "Contact messages",
  description: "Submissions from the public contact form.",
  service: contactService,
  supportsCreate: false,
  searchable: true,
  searchPlaceholder: "Search names, emails and text…",
  columns: [
    {
      key: "from",
      header: "From",
      render: (dto) => <NameCell title={dto.name} subtitle={`${dto.email} · ${dto.subject}`} />,
    },
    {
      key: "message",
      header: "Message",
      render: (dto) => <Excerpt value={dto.message} length={120} />,
    },
    {
      key: "received",
      header: "Received",
      secondary: true,
      render: (dto) => <span className="text-fg-muted">{formatFullDate(dto.sentAt) ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (dto) => <Badge tone={dto.isRead ? "off" : "accent"}>{dto.isRead ? "Read" : "Unread"}</Badge>,
    },
  ],
  rowAction: (dto, { update, busy }) =>
    dto.isRead ? null : (
      <button
        type="button"
        disabled={busy}
        onClick={() => update({ isRead: true })}
        className="btn-icon"
        title="Mark as read"
        aria-label={`Mark the message from ${dto.name} as read`}
      >
        <MailCheck aria-hidden="true" className="size-4" />
      </button>
    ),
  fields: [
    { name: "name", label: "Name", kind: "text" },
    { name: "email", label: "Email", kind: "email" },
    { name: "subject", label: "Subject", kind: "text" },
    { name: "message", label: "Message", kind: "textarea", wide: true, rows: 8 },
    { name: "isRead", label: "Mark as read", kind: "toggle" },
  ],
  defaults: () => ({ name: "", email: "", subject: "", message: "", isRead: false }),
  fromDto: (dto) => ({
    name: dto.name ?? "",
    email: dto.email ?? "",
    subject: dto.subject ?? "",
    message: dto.message ?? "",
    isRead: Boolean(dto.isRead),
  }),
};

/* ------------------------------------------------------------------ registry */

export const RESOURCE_SPECS: ResourceSpec<never>[] = [
  profileSpec,
  projectSpec,
  categorySpec,
  tagSpec,
  technologySpec,
  typeSpec,
  skillSpec,
  serviceSpec,
  experienceSpec,
  educationSpec,
  certificationSpec,
  achievementSpec,
  socialLinkSpec,
  resumeSpec,
  blogPostSpec,
  contactMessageSpec,
] as unknown as ResourceSpec<never>[];

export function getResourceSpec(key: string): ResourceSpec<never> | undefined {
  return RESOURCE_SPECS.find((spec) => spec.key === key);
}

/* -------------------------------------------------------- form <-> payload */

/** Builds the initial value map for a form. */
export function buildInitialValues(spec: ResourceSpec<never>, dto: unknown): FormValues {
  const base = spec.defaults ? spec.defaults() : {};
  if (!dto) {
    // Ensure every declared field has an entry so inputs are always controlled.
    for (const field of spec.fields) {
      if (!(field.name in base)) base[field.name] = defaultForField(field);
    }
    return base;
  }

  const mapped = spec.fromDto ? spec.fromDto(dto as never) : {};
  for (const field of spec.fields) {
    if (field.kind === "file") continue;
    if (field.name in mapped) base[field.name] = mapped[field.name];
    else if (!(field.name in base)) base[field.name] = defaultForField(field);
  }
  return base;
}

function defaultForField(field: FieldSpec): unknown {
  switch (field.kind) {
    case "toggle":
      return false;
    case "multiselect":
      return [];
    case "number":
      return 0;
    default:
      return "";
  }
}

/** Builds the initial file state, seeding `removeExisting` from the stored URL. */
export function buildInitialFiles(spec: ResourceSpec<never>, dto: unknown): FormFiles {
  const files: FormFiles = {};
  for (const field of spec.fields) {
    if (field.kind !== "file") continue;
    const storedUrl = dto ? (dto as Record<string, unknown>)[field.urlField] : null;
    const hasStored = typeof storedUrl === "string" && storedUrl.trim().length > 0;
    files[field.name] = hasStored ? { file: null, removeExisting: false } : { ...EMPTY_FILE_VALUE };
  }
  return files;
}

/**
 * Turns form state into the exact payload the controller binds.
 *
 * Text fields left empty are omitted so the backend keeps its stored value; date fields left empty
 * become an explicit `null`, because clearing a date is an intentional edit. Uploads travel as the
 * bytes plus `isDelete`, never as a path.
 */
export function buildPayload(spec: ResourceSpec<never>, values: FormValues, files: FormFiles): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of spec.fields) {
    if (field.kind === "file") {
      const file = files[field.name];
      if (file?.file) payload[field.uploadField] = file.file;
      if (file?.removeExisting) payload[field.deleteField ?? "isDelete"] = true;
      continue;
    }

    const value = values[field.name];

    if (field.kind === "toggle") {
      payload[field.name] = Boolean(value);
      continue;
    }

    if (field.kind === "multiselect") {
      payload[field.name] = Array.isArray(value) ? (value as number[]) : [];
      continue;
    }

    if (field.kind === "number") {
      const numeric = typeof value === "number" ? value : Number(value);
      payload[field.name] = Number.isFinite(numeric) ? numeric : 0;
      continue;
    }

    // A select backed by a relation list is always an id picker.
    if (field.kind === "select" && field.relation) {
      const id = typeof value === "number" ? value : Number(value);
      payload[field.name] = Number.isFinite(id) && id > 0 ? id : 0;
      continue;
    }

    if (field.nullable) {
      payload[field.name] = typeof value === "string" && value.trim() === "" ? null : value;
      continue;
    }

    // Empty optional text is omitted rather than sent as "".
    if (typeof value === "string" && value.trim() === "") continue;
    payload[field.name] = value ?? "";
  }

  // Only `undefined` is dropped: an explicit `null` on a nullable date is a real edit.
  const pruned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) pruned[key] = value;
  }
  return pruned;
}

/** The URL the server currently serves for a file field, if any. */
export function currentFileUrl(dto: unknown, field: FileFieldSpec): string | undefined {
  if (!dto) return undefined;
  const value = (dto as Record<string, unknown>)[field.urlField];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
