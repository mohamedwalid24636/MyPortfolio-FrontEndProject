#!/usr/bin/env node
/**
 * Imports the whole portfolio from the raw material in ../NeededData through the real admin API.
 *
 * The content itself lives in ./portfolio-content.mjs, where every entry names the file it came
 * from and every inferred value carries an assumption tag (A1..A9). This file is only transport:
 * it signs in, resolves asset paths, and creates or refreshes each record through the same
 * endpoints the admin panel uses.
 *
 * Why the API and not a migration or raw SQL
 *   - Attachments are the reason. Every image, logo and PDF has to pass through AttachementService,
 *     which owns the folder, the stored name, the size ceiling and the URL. Writing rows directly
 *     would leave the database pointing at files that were never stored.
 *   - The same applies to slugs, reading times, cover paths and the single-active-resume rule: those
 *     are server-side invariants that only the endpoints enforce.
 *
 * Idempotency
 *   Every resource is keyed by a natural key (name / title / caption / slug / platform), and a row
 *   that already exists is refreshed with a PUT rather than duplicated. Images are only uploaded
 *   when the row has nothing stored for that field, so re-running does not litter the attachment
 *   folder with duplicate GUIDs. Set REUPLOAD_IMAGES=1 to force fresh copies.
 *
 * Placeholder cleanup
 *   `--reset` deletes every existing portfolio record first — files go with the rows — which is the
 *   only reliable way to clear demo rows from an earlier run. The admin account and the
 *   contact-message inbox are left alone.
 *
 * Usage
 *   npm run verify:content                    # offline: check the content model and its files
 *   node scripts/seed.mjs                     # create or refresh everything
 *   node scripts/seed.mjs --reset             # wipe portfolio content first, then import
 *   node scripts/seed.mjs --dry-run           # print the create/update plan, write nothing
 *   node scripts/seed.mjs --only=Projects,BlogPosts
 *
 * --dry-run still needs the API, because deciding between a create and an update means reading what
 * is already stored. Use verify:content for the checks that need no server.
 *
 * Environment
 *   API_BASE        defaults to http://localhost:5022/api
 *   SELF_SIGNED=1   skip TLS verification (only with the https profile)
 *   ADMIN_EMAIL     must match AdminSeed:Email
 *   ADMIN_PASSWORD  must match AdminSeed:Password
 *   NEEDED_DATA_DIR source folder, defaults to ../../NeededData
 *   REUPLOAD_IMAGES 1 to re-upload images that are already stored
 */

import { readFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACHIEVEMENTS,
  BLOG_POSTS,
  CERTIFICATIONS,
  CATEGORIES,
  EDUCATIONS,
  EXPERIENCES,
  PROFILE,
  PROJECTS,
  RESUMES,
  SERVICES,
  SKILLS,
  SOCIAL_LINKS,
  TAGS,
  TECHNOLOGIES,
  TYPES,
} from "./portfolio-content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(HERE, "..");

const API_BASE = (process.env.API_BASE || "http://localhost:5022/api").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const NEEDED_DATA_DIR = resolve(
  process.env.NEEDED_DATA_DIR || join(APP_DIR, "..", "NeededData"),
);
const REUPLOAD_IMAGES = process.env.REUPLOAD_IMAGES === "1";

const argv = process.argv.slice(2);
const RESET = argv.includes("--reset");
const DRY_RUN = argv.includes("--dry-run");
const ONLY = (argv.find((argument) => argument.startsWith("--only=")) ?? "").replace("--only=", "");
const ONLY_SET = ONLY ? new Set(ONLY.split(",").map((value) => value.trim()).filter(Boolean)) : null;

if (process.env.SELF_SIGNED === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let accessToken = null;

const counts = { created: 0, updated: 0, removed: 0, failed: 0 };
const problems = [];
const warnings = [];

/** Controllers that bind [FromForm] — everything else takes a JSON body. */
const FORM_RESOURCES = new Set([
  "Achievements",
  "BlogPosts",
  "Certifications",
  "Educations",
  "Experiences",
  "ProjectImages",
  "Projects",
  "Profiles",
  "Resumes",
  "Services",
  "Skills",
  "SocialLinks",
  "Technologies",
]);

/** Deletion order for --reset: children before parents so no foreign key is left dangling. */
const RESET_ORDER = [
  "BlogPosts",
  "ProjectImages",
  "Projects",
  "Achievements",
  "Certifications",
  "Resumes",
  "SocialLinks",
  "Experiences",
  "Educations",
  "Services",
  "Skills",
  "Technologies",
  "Tags",
  "Categories",
  "Types",
  "Profiles",
];

const MIME_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
};

function mimeFor(path) {
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();

  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

/**
 * Resolves an asset reference to an absolute path.
 *   "Talabate LinkedIn Post/HomePage.png"   -> inside NeededData
 *   "@asset:public/assets/images/x.svg"     -> inside this frontend repo
 */
function assetPath(spec) {
  const prefix = "@asset:";

  if (!spec.startsWith(prefix)) {
    return join(NEEDED_DATA_DIR, ...spec.split("/").filter(Boolean));
  }

  return join(APP_DIR, ...spec.slice(prefix.length).split("/").filter(Boolean));
}

/* --------------------------------------------------------------- transport */

async function filePart(spec) {
  const absolute = assetPath(spec);
  const bytes = await readFile(absolute);
  const name = absolute.slice(absolute.lastIndexOf(sep) + 1);

  return new File([bytes], name, { type: mimeFor(absolute) });
}

/**
 * Builds a multipart body.
 *
 * `payload` becomes ordinary form fields; arrays are appended once per item, which is how the
 * `List<int>` properties (CategoryIds, TagIds, TechnologyIds, TypeIds) bind.
 *
 * `files` maps a form field name to `{ spec, skipIfExists }`, where `spec` is a NeededData reference
 * and `skipIfExists` was decided per attachment. Profile owns two images, and each is checked
 * against its own response property, so a stored profile photo does not starve the about image.
 */
async function buildForm(payload, files = {}) {
  const form = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;

    // A List<int> binds from repeated fields of the same name, which is how CategoryIds,
    // TagIds, TechnologyIds and TypeIds arrive.
    if (Array.isArray(value)) {
      for (const item of value) form.append(key, String(item));
      continue;
    }

    form.append(key, String(value));
  }

  for (const [field, descriptor] of Object.entries(files)) {
    if (!descriptor?.spec) continue;
    if (descriptor.skipIfExists && !REUPLOAD_IMAGES) continue;

    form.append(field, await filePart(descriptor.spec));
  }

  return form;
}

/** Server-derived properties that must never be sent back: they describe stored bytes or the row itself. */
function requestOnly(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

async function signIn() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(
      `POST /auth/login -> ${response.status}. Check that the API is running, that the ` +
        "AddIdentityAuth migration has been applied, and that ADMIN_EMAIL / ADMIN_PASSWORD match " +
        "the AdminSeed section of appsettings.json.",
    );
  }

  const body = await response.json();

  if (!body?.token) throw new Error("POST /auth/login returned no token.");

  accessToken = body.token;
  console.log(`Signed in as ${body.email ?? ADMIN_EMAIL}\n`);
}

async function api(path, { method = "GET", form, json } = {}) {
  const init = { method, headers: { Accept: "application/json" } };

  if (accessToken) init.headers.Authorization = `Bearer ${accessToken}`;
  if (form) init.body = form;
  else if (json !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(json);
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  const text = await response.text();

  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const hint = response.status === 401 || response.status === 403 ? " Token refused or expired." : "";

    throw new Error(`${method} ${path} -> ${response.status} ${JSON.stringify(parsed)}.${hint}`);
  }

  return parsed;
}

/** pageSize is clamped to 100 server-side, so page through when a set can exceed that. */
async function listAll(resource) {
  const collected = [];
  let pageIndex = 1;
  let totalPages = 1;

  do {
    const page = await api(`/${resource}?pageIndex=${pageIndex}&pageSize=100`);
    collected.push(...(page?.data ?? []));
    totalPages = page?.totalPages ?? 1;
    pageIndex += 1;
  } while (pageIndex <= totalPages);

  return collected;
}

/** One listing per resource per run, then kept in step by upsert. */
const cache = new Map();

async function rows(resource) {
  if (!cache.has(resource)) cache.set(resource, await listAll(resource));

  return cache.get(resource);
}

function remember(resource, row) {
  const cached = cache.get(resource);
  if (cached) cached.push(row);
}

/* ------------------------------------------------------------------ upsert */

/**
 * Creates or refreshes one record.
 *
 * `match` receives a row from the API and decides whether it is the same record as the source entry.
 * `files` maps a DTO file field to `{ spec, urlField }`; when that urlField already holds a value the
 * upload is skipped unless REUPLOAD_IMAGES=1.
 */
async function upsert(resource, label, match, { payload, files = {} }) {
  const existing = (await rows(resource)).find(match) ?? null;
  const body = requestOnly(payload);

  // A stored attachment is only re-uploaded when the caller asks for it, so re-running the importer
  // cannot leave a trail of duplicate GUIDs in the attachment folder.
  const formFiles = Object.fromEntries(
    Object.entries(files).map(([field, descriptor]) => [
      field,
      { spec: descriptor.spec, skipIfExists: Boolean(existing?.[descriptor.urlField]) },
    ]),
  );

  const isForm = FORM_RESOURCES.has(resource);

  if (DRY_RUN) {
    counts[existing ? "updated" : "created"] += 1;
    console.log(`  ${existing ? "~" : "+"} ${resource}: ${label} (${existing ? "update" : "create"})`);

    return existing ?? { id: 0 };
  }

  try {
    if (!existing) {
      const created = isForm
        ? await api(`/${resource}`, { method: "POST", form: await buildForm(body, formFiles) })
        : await api(`/${resource}`, { method: "POST", json: body });

      remember(resource, created);
      counts.created += 1;
      console.log(`  + ${resource}: ${label}`);

      return created;
    }

    if (isForm) {
      await api(`/${resource}/${existing.id}`, {
        method: "PUT",
        form: await buildForm(body, formFiles),
      });
    } else {
      await api(`/${resource}/${existing.id}`, { method: "PUT", json: body });
    }

    counts.updated += 1;
    console.log(`  ~ ${resource}: ${label}`);

    return existing;
  } catch (error) {
    counts.failed += 1;
    problems.push(`${resource} "${label}": ${error.message}`);
    console.error(`  ! ${resource}: ${label} -> ${error.message}`);

    return existing;
  }
}

/**
 * Builds a matcher for a natural key. Gallery images need a two-field key (project + caption) and
 * the experience row needs one too, so both forms are expressed as closures.
 */
const sameValue = (field, value) => (row) => String(row[field]) === String(value);
const sameValues = (fields) => (row) => fields.every(([field, value]) => String(row[field]) === String(value));

/* -------------------------------------------------------------------- data */

async function resetContent() {
  if (DRY_RUN) {
    console.log("[dry-run] would delete every existing record in this order:");
    console.log(`  ${RESET_ORDER.join(", ")}\n`);

    return;
  }

  console.log("Resetting portfolio content (the admin account and contact inbox are untouched)");

  for (const resource of RESET_ORDER) {
    const existing = await listAll(resource);
    let removed = 0;

    for (const row of existing) {
      try {
        await api(`/${resource}/${row.id}`, { method: "DELETE" });
        removed += 1;
      } catch (error) {
        problems.push(`DELETE ${resource}/${row.id}: ${error.message}`);
        console.error(`  ! could not delete ${resource}/${row.id} -> ${error.message}`);
      }
    }

    counts.removed += removed;
    if (removed) console.log(`  - ${resource}: removed ${removed}`);
    cache.delete(resource);
  }

  console.log("");
}

/** Skills, categories, tags, technologies — everything the projects reference by id. */
async function importReferenceData() {
  console.log("Skill types");
  const typeIds = new Map();
  for (const type of TYPES) {
    const row = await upsert("Types", type.name, sameValue("name", type.name), { payload: type });
    if (row) typeIds.set(type.name, row.id);
  }

  console.log("\nCategories");
  const categoryIds = new Map();
  for (const category of CATEGORIES) {
    const row = await upsert("Categories", category.name, sameValue("name", category.name), {
      payload: category,
    });
    if (row) categoryIds.set(category.name, row.id);
  }

  console.log("\nTags");
  const tagIds = new Map();
  for (const tag of TAGS) {
    const row = await upsert("Tags", tag.name, sameValue("name", tag.name), { payload: tag });
    if (row) tagIds.set(tag.name, row.id);
  }

  console.log("\nTechnologies");
  const technologyIds = new Map();
  for (const technology of TECHNOLOGIES) {
    // No technology icon exists in NeededData; the frontend falls back to a lettered badge.
    const row = await upsert("Technologies", technology.name, sameValue("name", technology.name), {
      payload: technology,
    });
    if (row) technologyIds.set(technology.name, row.id);
  }

  const unresolved = [];

  for (const project of PROJECTS) {
    for (const name of project.categories) if (!categoryIds.has(name)) unresolved.push(`${project.key}: category ${name}`);
    for (const name of project.tags) if (!tagIds.has(name)) unresolved.push(`${project.key}: tag ${name}`);
    for (const name of project.technologies) if (!technologyIds.has(name)) unresolved.push(`${project.key}: technology ${name}`);
  }

  for (const skill of SKILLS) {
    for (const name of skill.types) if (!typeIds.has(name)) unresolved.push(`skill ${skill.name}: type ${name}`);
  }

  if (unresolved.length) {
    warnings.push(`references that did not resolve: ${unresolved.join(", ")}`);
  }

  return { typeIds, categoryIds, tagIds, technologyIds };
}

const resolveIds = (map, names) => [...new Set(names.map((name) => map.get(name)))].filter((id) => typeof id === "number");

async function importSkills(typeIds) {
  console.log("\nSkills");
  for (const skill of SKILLS) {
    // proficiencyLevel is deliberately absent: no source file in NeededData states a level, and the
    // UI renders a progress bar from it, so a number here would be an invented claim.
    await upsert("Skills", skill.name, sameValue("name", skill.name), {
      payload: {
        name: skill.name,
        description: skill.description,
        typeIds: resolveIds(typeIds, skill.types),
      },
    });
  }
}

async function importProjects({ categoryIds, tagIds, technologyIds }) {
  console.log("\nProjects");
  const projectIds = new Map();

  for (const project of PROJECTS) {
    const row = await upsert("Projects", project.title, sameValue("title", project.title), {
      files: { image: { spec: project.cover, urlField: "imageUrl" } },
      payload: {
        title: project.title,
        description: project.description,
        shortDescription: project.shortDescription,
        githubUrl: project.githubUrl,
        liveDemoUrl: project.liveDemoUrl,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        featured: project.featured,
        categoryIds: resolveIds(categoryIds, project.categories),
        tagIds: resolveIds(tagIds, project.tags),
        technologyIds: resolveIds(technologyIds, project.technologies),
      },
    });

    if (row) projectIds.set(project.key, row.id);
  }

  console.log("\nProject galleries");
  for (const project of PROJECTS) {
    const projectId = projectIds.get(project.key);
    if (!projectId || !project.gallery.length) continue;

    for (const [index, image] of project.gallery.entries()) {
      const label = `${project.title} / ${image.caption}`;

      // A gallery row is identified by its project plus caption, so re-running refreshes the same
      // image instead of appending a second copy of every screenshot.
      await upsert("ProjectImages", label,
        (row) => row.projectId === projectId && row.caption === image.caption,
        {
          files: { image: { spec: image.file, urlField: "imageUrl" } },
          payload: {
            caption: image.caption,
            displayOrder: String(index + 1),
            projectId,
          },
        },
      );
    }
  }
}

async function importProfile() {
  console.log("\nProfile");
  const { image, aboutImage, ...fields } = PROFILE;

  await upsert("Profiles", PROFILE.fullName, sameValue("fullName", PROFILE.fullName), {
    // Each attachment is checked against its own response property: a stored profile photo must not
    // stop the about image from being uploaded on the same request.
    files: {
      image: { spec: image, urlField: "profileImageUrl" },
      aboutImage: { spec: aboutImage, urlField: "aboutImageUrl" },
    },
    payload: fields,
  });
}

async function importSocialLinks() {
  console.log("\nSocial links");
  for (const link of SOCIAL_LINKS) {
    const { icon, ...fields } = link;

    await upsert("SocialLinks", link.platform, sameValue("platform", link.platform), {
      files: { icon: { spec: icon, urlField: "iconUrl" } },
      payload: fields,
    });
  }
}

async function importExperienceAndEducation() {
  console.log("\nExperience");
  for (const job of EXPERIENCES) {
    const { logo, ...fields } = job;

    await upsert("Experiences", `${job.jobTitle} — ${job.companyName}`,
      sameValues([["jobTitle", job.jobTitle], ["companyName", job.companyName]]),
      {
        files: { companyLogo: { spec: logo, urlField: "companyLogoUrl" } },
        payload: fields,
      },
    );
  }

  console.log("\nEducation");
  for (const school of EDUCATIONS) {
    const { logo, ...fields } = school;

    await upsert("Educations", school.institutionName,
      sameValue("institutionName", school.institutionName),
      {
        files: { institutionLogo: { spec: logo, urlField: "institutionLogoUrl" } },
        payload: fields,
      },
    );
  }

  console.log("\nCertifications");
  for (const certification of CERTIFICATIONS) {
    await upsert("Certifications", certification.name, sameValue("name", certification.name), {
      // The DTO has no description property, so the content model keeps the diploma summary for
      // the blog and the report only; and NeededData has no certificate scan to upload.
      payload: {
        name: certification.name,
        issuingOrganization: certification.issuingOrganization,
        issueDate: certification.issueDate,
        doesNotExpire: certification.doesNotExpire,
      },
    });
  }
}

async function importServices() {
  console.log("\nServices");
  for (const service of SERVICES) {
    await upsert("Services", service.title, sameValue("title", service.title), {
      // isActive is a non-nullable bool on the DTO, so leaving it out of an update would silently
      // switch the service off. Every service is part of the offering, so it is always sent.
      payload: { ...service, isActive: true },
    });
  }
}

async function importAchievements() {
  console.log("\nAchievements");
  for (const achievement of ACHIEVEMENTS) {
    const { image, ...fields } = achievement;

    await upsert("Achievements", achievement.title, sameValue("title", achievement.title), {
      files: { image: { spec: image, urlField: "imageUrl" } },
      payload: fields,
    });
  }
}

async function importResume() {
  console.log("\nResume");
  for (const resume of RESUMES) {
    const { file, ...fields } = resume;

    await upsert("Resumes", resume.title, sameValue("title", resume.title), {
      // The PDF is uploaded from NeededData, not from public/assets, so the backend copy is the one
      // the CV was taken from.
      files: { file: { spec: file, urlField: "fileUrl" } },
      payload: fields,
    });
  }
}

async function importBlogPosts() {
  console.log("\nBlog posts");
  for (const post of BLOG_POSTS) {
    // cover is uploaded, key is a local handle rather than a DTO property; both are dropped.
    const { cover, key, ...fields } = post;

    void key;

    await upsert("BlogPosts", fields.title, sameValue("title", fields.title), {
      // Slug, reading time and publishedAt are derived server-side and must not be sent.
      files: { coverImage: { spec: cover, urlField: "coverImageUrl" } },
      payload: fields,
    });
  }
}

/* -------------------------------------------------------------------- run */

function report() {
  console.log("\n----------------------------------------");
  if (counts.removed) console.log(`removed: ${counts.removed}`);
  console.log(`created: ${counts.created}`);
  console.log(`updated: ${counts.updated}`);
  console.log(`failed:  ${counts.failed}`);

  if (DRY_RUN) {
    console.log("(dry run — no record was created, updated or deleted)");
  }

  for (const warning of warnings) console.log(`\nWarning: ${warning}`);

  if (problems.length) {
    console.log("\nProblems:");
    for (const problem of problems) console.log(`  - ${problem}`);
  }
}

async function main() {
  console.log(`Importing portfolio content from ${NEEDED_DATA_DIR}`);
  console.log(`API: ${API_BASE}${DRY_RUN ? "   (dry run — nothing will be written)" : ""}\n`);

  await signIn();

  if (RESET) await resetContent();

  const wants = (resource) => !ONLY_SET || ONLY_SET.has(resource);

  const reference = await importReferenceData();

  if (wants("Skills")) await importSkills(reference.typeIds);
  if (wants("Projects")) await importProjects(reference);
  if (wants("Profiles")) await importProfile();
  if (wants("SocialLinks")) await importSocialLinks();
  if (wants("Experiences")) await importExperienceAndEducation();
  if (wants("Services")) await importServices();
  if (wants("Achievements")) await importAchievements();
  if (wants("Resumes")) await importResume();
  if (wants("BlogPosts")) await importBlogPosts();

  report();

  if (counts.failed > 0) {
    process.exitCode = 1;
  } else if (DRY_RUN) {
    console.log(`\nDry run only: ${counts.created} to create, ${counts.updated} to refresh. Nothing was written.`);
  } else {
    console.log("\nDone. The API is now serving the imported content.");
  }
}

main().catch((error) => {
  report();
  console.error("\nImport failed:", error.message);
  process.exit(1);
});