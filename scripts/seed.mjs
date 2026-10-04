#!/usr/bin/env node
/**
 * Seeds the portfolio API with the real CV content.
 *
 * Everything below comes from Mohamed_Walid_Abdullah_CV.pdf — no invented
 * facts. Fields the CV does not state (skill proficiency levels, project
 * dates, credential ids) are intentionally left empty so the UI renders
 * without fabricated data.
 *
 * Transport note: only Types, Tags, Categories and ContactMessages bind JSON.
 * Every other resource owns an upload, so its controller binds
 * `multipart/form-data` and this script posts FormData for those. Read-only
 * URL fields (`imageUrl`, `fileUrl`, ...) are never sent — the server owns the
 * stored path and hands the URL back on read.
 *
 * The script is idempotent: it creates only what is missing, so it can be
 * re-run after a partial failure.
 *
 * Auth note: every write endpoint is admin-only, so the script signs in over
 * /auth/login first and sends the returned bearer token on each request. Reads
 * are public and would work without it.
 *
 * Usage:  node scripts/seed.mjs
 * Env:    API_BASE=https://localhost:7067/api
 *         SELF_SIGNED=1        (skip TLS verification for the dev certificate)
 *         ADMIN_EMAIL=...      (defaults to the seeded admin account)
 *         ADMIN_PASSWORD=...
 */

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(HERE, "..", "public");

// Defaults to the same plain-HTTP origin the Vite dev proxy uses, so no TLS bypass is needed. Point
// it at the https profile only together with SELF_SIGNED=1, because the dev certificate is
// self-signed and Node's fetch rejects it outright.
const API_BASE = (process.env.API_BASE || "http://localhost:5022/api").replace(/\/+$/, "");

// These must match the AdminSeed section of the API's appsettings.json.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

/** Set by signIn() and attached to every subsequent write. */
let accessToken = null;

if (process.env.SELF_SIGNED === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/** Resources whose controller binds `[FromForm]`, i.e. anything that owns an upload. */
const FORM_RESOURCES = new Set([
  "Profiles",
  "Projects",
  "ProjectImages",
  "Technologies",
  "Skills",
  "Services",
  "Experiences",
  "Educations",
  "Certifications",
  "Achievements",
  "SocialLinks",
  "Resumes",
  "BlogPosts",
]);

/* ------------------------------------------------------------------ data */

const TYPES = [
  { name: "Languages", description: "Programming languages I write in every day" },
  { name: "Backend", description: "Server-side frameworks and data access" },
  { name: "Architecture", description: "How I structure maintainable solutions" },
  { name: "Database", description: "Relational modelling and persistence" },
  { name: "Tools", description: "Everyday developer tooling" },
];

const SKILLS = [
  { name: "C#", types: ["Languages"] },
  { name: "SQL", types: ["Languages"] },
  { name: "Python", types: ["Languages"] },
  { name: "C++", types: ["Languages"] },
  { name: "ASP.NET Core (Web API / MVC)", types: ["Backend"] },
  { name: "Entity Framework Core", types: ["Backend", "Database"] },
  { name: "LINQ", types: ["Backend"] },
  { name: "RESTful APIs", types: ["Backend", "Architecture"] },
  { name: "Onion / N-Tier Architecture", types: ["Architecture"] },
  { name: "Clean Architecture", types: ["Architecture"] },
  { name: "Repository & Unit of Work", types: ["Architecture"] },
  { name: "Specification Pattern", types: ["Architecture"] },
  { name: "Dependency Injection", types: ["Architecture"] },
  { name: "Pagination", types: ["Architecture"] },
  { name: "SOLID Principles", types: ["Architecture"] },
  { name: "Caching", types: ["Backend"] },
  { name: "SQL Server", types: ["Database"] },
  { name: "ERD Design", types: ["Database"] },
  { name: "Schema Design", types: ["Database"] },
  { name: "Code-First", types: ["Database"] },
  { name: "Database-First", types: ["Database"] },
  { name: "Git", types: ["Tools"] },
  { name: "GitHub", types: ["Tools"] },
  { name: "Postman", types: ["Tools"] },
  { name: "Swagger", types: ["Tools"] },
  { name: "Redis", types: ["Tools"] },
  { name: "AutoMapper", types: ["Tools"] },
  { name: "Stripe", types: ["Tools"] },
];

const CATEGORIES = [
  { name: "Graduation Project", description: "University final-year work", slug: "graduation-project" },
  { name: "Web Application", description: "End-to-end web applications", slug: "web-application" },
  { name: "Backend", description: "API-first and service-oriented work", slug: "backend" },
];

const TAGS = [
  { name: "ASP.NET Core", slug: "aspnet-core" },
  { name: "Clean Architecture", slug: "clean-architecture" },
  { name: "Entity Framework Core", slug: "entity-framework-core" },
  { name: "SQL Server", slug: "sql-server" },
  { name: "Django", slug: "django" },
  { name: "REST API", slug: "rest-api" },
];

const TECHNOLOGIES = [
  { name: ".NET", description: "Microsoft .NET platform", category: "Backend" },
  { name: "ASP.NET Core", description: "Cross-platform web framework", category: "Backend" },
  { name: "Entity Framework Core", description: "Object-relational mapper", category: "Database" },
  { name: "SQL Server", description: "Relational database engine", category: "Database" },
  { name: "LINQ", description: "Language-integrated query", category: "Backend" },
  { name: "Django", description: "Python web framework", category: "Backend" },
  { name: "Python", description: "Programming language", category: "Languages" },
  { name: "C++", description: "Programming language", category: "Languages" },
  { name: "AutoMapper", description: "Object-to-object mapping", category: "Tools" },
  { name: "Redis", description: "Distributed caching", category: "Tools" },
  { name: "Stripe", description: "Payments integration", category: "Tools" },
  { name: "Swagger", description: "OpenAPI documentation", category: "Tools" },
  { name: "Postman", description: "API client and testing", category: "Tools" },
  { name: "Git", description: "Version control", category: "Tools" },
];

const PROJECTS = [
  {
    title: "Neurea Mental Health Support System",
    shortDescription:
      "Graduation project combining ASP.NET Core and Django around structured mental-health support workflows.",
    description:
      "Final-year graduation project that merged an ASP.NET Core solution with a Django component over a shared database, so support sessions, assessments and follow-ups are handled through one consistent workflow. Graded A*.",
    githubUrl:
      "https://github.com/mohamedwalid24636/Neurea.MentalHealthSupportSystemMergeDataBase-Asp.net-Django-.git",
    featured: true,
    status: "Completed",
    categories: ["Graduation Project", "Web Application"],
    tags: ["ASP.NET Core", "Django", "SQL Server", "Clean Architecture"],
    technologies: [".NET", "ASP.NET Core", "Django", "Python", "SQL Server", "Entity Framework Core"],
  },
  {
    title: "Laboratory Management System",
    shortDescription: "Operations platform for managing laboratory data, workflows and integrity.",
    description:
      "A system for running laboratory operations on relational data: modelling the domain in SQL Server, exposing it through ASP.NET Core endpoints and keeping records consistent across the workflows a lab actually performs.",
    githubUrl: "https://github.com/mohamedwalid24636/LaboratoriesManagementSystem",
    featured: true,
    status: "Completed",
    categories: ["Web Application", "Backend"],
    tags: ["SQL Server", "Entity Framework Core", "REST API", "Clean Architecture"],
    technologies: [".NET", "ASP.NET Core", "Entity Framework Core", "SQL Server", "AutoMapper"],
  },
  {
    title: "E-Commerce Backend API",
    shortDescription: "Clean-architecture RESTful backend for an e-commerce product.",
    description:
      "A backend-only e-commerce service built around clean architecture: presentation, application and domain/infrastructure layers stay separated, AutoMapper handles DTO mapping, and Stripe is wired in for payment flows.",
    githubUrl: "https://github.com/mohamedwalid24636/E-Commerse.Website.git",
    featured: true,
    status: "Completed",
    categories: ["Backend"],
    tags: ["ASP.NET Core", "REST API", "Clean Architecture", "SQL Server"],
    technologies: [".NET", "ASP.NET Core", "Entity Framework Core", "SQL Server", "AutoMapper", "Stripe"],
  },
];

const SERVICES = [
  {
    title: "RESTful API Development",
    description:
      "Build and maintain RESTful APIs with ASP.NET Core, with clear contracts, consistent responses and Swagger documentation for every endpoint.",
    displayOrder: 1,
    isActive: true,
  },
  {
    title: "Relational Database Design",
    description:
      "Model normalised SQL Server schemas, design ERDs, and work fluently with both Code-First and Database-First EF Core workflows.",
    displayOrder: 2,
    isActive: true,
  },
  {
    title: "Clean Architecture & Code Structure",
    description:
      "Separate concerns with Onion/N-tier or Clean Architecture, applying Repository, Unit of Work, Specification and SOLID principles.",
    displayOrder: 3,
    isActive: true,
  },
  {
    title: "Caching & Third-Party Integrations",
    description:
      "Speed up data access with Redis caching and integrate external services such as Stripe payments through clean abstractions.",
    displayOrder: 4,
    isActive: true,
  },
];

const PROFILES = [
  {
    fullName: "Mohamed Walid Abdullah",
    professionalTitle: "Backend .NET Developer",
    bio: "Computer Science graduate focused on backend development with ASP.NET Core. I design relational databases, build RESTful APIs, and apply modern architecture principles — Clean Architecture, Repository/Unit of Work, and the Specification pattern — to keep software maintainable. Recently completed a 120-hour backend programme at Route Academy and a graduation project graded A*.",
    location: "Giza, Egypt",
    email: "Mewalid24636@gmail.com",
    phone: "+201005041584",
    yearsOfExperience: 1,
    // Uploaded as multipart `image`; the server decides the stored path.
    file: "assets/images/profile.jpg",
    fileField: "image",
  },
];

const SOCIAL_LINKS = [
  { platform: "GitHub", username: "mohamedwalid24636", url: "https://github.com/mohamedwalid24636" },
  { platform: "LinkedIn", username: "mohamed-walid", url: "https://www.linkedin.com/in/mohamed-walid-6b12a8314" },
  { platform: "Email", username: "Mewalid24636@gmail.com", url: "mailto:Mewalid24636@gmail.com" },
];

const EXPERIENCES = [
  {
    jobTitle: "Backend .NET Developer Trainee",
    companyName: "Route Academy",
    location: "Giza, Egypt",
    employmentType: "Full Time",
    description:
      "Completed a 120-hour Backend .NET diploma. Built ASP.NET Core MVC and Web API applications, designed relational databases, and applied Clean Architecture principles through hands-on projects.",
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    isCurrent: false,
  },
];

const EDUCATIONS = [
  {
    institutionName: "Misr University for Science & Technology",
    degree: "Bachelor of Science",
    fieldOfStudy: "Computer Science",
    description:
      "Graduated with an Excellent standing of CGPA 3.68 / 4.00. Graduation project (Neurea Mental Health Support System) graded A*.",
    startDate: "2022-09-01",
    endDate: "2026-07-01",
    isCurrent: false,
  },
];

const CERTIFICATIONS = [
  {
    name: "Backend .NET Diploma",
    issuingOrganization: "Route Academy",
    issueDate: "2025-12-31",
    doesNotExpire: true,
  },
];

const ACHIEVEMENTS = [
  {
    title: "Graduation project graded A*",
    description:
      "Awarded an A* for the Neurea Mental Health Support System, which merged an ASP.NET Core solution with a Django component over a shared database.",
    date: "2026-07-01",
    url: "https://github.com/mohamedwalid24636/Neurea.MentalHealthSupportSystemMergeDataBase-Asp.net-Django-.git",
    file: "assets/images/graduation.jpg",
    fileField: "image",
  },
  {
    title: "CGPA 3.68 / 4.00 — Excellent",
    description:
      "Graduated from Misr University for Science & Technology with an Excellent standing in Computer Science.",
    date: "2026-07-01",
  },
  {
    title: "120-hour Backend .NET programme",
    description:
      "Completed the Route Academy backend diploma covering ASP.NET Core, EF Core, relational design and Clean Architecture.",
    date: "2025-12-31",
  },
];

const RESUMES = [
  {
    title: "Mohamed Walid Abdullah — Curriculum Vitae",
    isActive: true,
    // The server stores the PDF itself; only the active flag and title are plain form fields.
    file: "assets/cv/Mohamed_Walid_Abdullah_CV.pdf",
    fileField: "file",
  },
];

/* --------------------------------------------------------------- transport */

/** Guesses the MIME type from the extension, since FormData needs one. */
const MIME_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

function mimeFor(path) {
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

async function filePart(relativePath) {
  const absolute = join(PUBLIC_DIR, relativePath);
  const bytes = await readFile(absolute);
  const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
  return new File([bytes], name, { type: mimeFor(relativePath) });
}

async function buildForm(payload) {
  const form = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;

    if (key === "file") {
      // `file` is this script's marker for "upload public/<value> as fileField".
      continue;
    }

    if (value === null) {
      // An explicit null clears a nullable date; FormData has no null, so send nothing
      // and let the server keep whatever it already has.
      continue;
    }

    if (Array.isArray(value)) {
      // Repeated fields are how ASP.NET binds List<int> from a form.
      for (const item of value) form.append(key, String(item));
      continue;
    }

    if (typeof value === "boolean") form.append(key, value ? "true" : "false");
    else form.append(key, String(value));
  }

  if (typeof payload.file === "string") {
    form.append(payload.fileField ?? "file", await filePart(payload.file));
  }

  return form;
}

/**
 * Exchanges the admin credentials for a bearer token.
 *
 * The API answers 401 with no body for bad credentials, so there is nothing to inspect here — a
 * failure means either the wrong details or an API that has not created the account yet.
 */
async function signIn() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(
      `POST /auth/login -> ${response.status}. Check the API is running, that the AddIdentityAuth ` +
        `migration has been applied, and that ADMIN_EMAIL / ADMIN_PASSWORD match its AdminSeed section.`,
    );
  }

  const body = await response.json();

  if (!body?.token) {
    throw new Error("POST /auth/login returned no token.");
  }

  accessToken = body.token;
  console.log(`Signed in as ${body.email ?? ADMIN_EMAIL}\n`);
}

async function api(path, { method = "GET", form, json } = {}) {
  const init = { method, headers: { Accept: "application/json" } };

  if (accessToken) {
    init.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (form) {
    init.body = form;
  } else if (json !== undefined) {
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
    const hint =
      response.status === 401 || response.status === 403
        ? " The admin token was refused — is it expired?"
        : "";

    throw new Error(`${method} ${path} -> ${response.status} ${JSON.stringify(parsed)}.${hint}`);
  }

  return parsed;
}

async function create(resource, payload) {
  const isForm = FORM_RESOURCES.has(resource);

  if (isForm) {
    await api(`/${resource}`, { method: "POST", form: await buildForm(payload) });
  } else {
    const { file, fileField, ...rest } = payload;
    void file;
    void fileField;
    await api(`/${resource}`, { method: "POST", json: rest });
  }

  const label = payload.name ?? payload.title ?? payload.fullName ?? payload.jobTitle ?? payload.institutionName;
  console.log(`  + ${resource}: ${label}`);
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

/**
 * Creates only the items that are missing and returns a name -> id map, so the
 * script can be re-run safely after a partial failure.
 */
async function ensureMany(resource, items, key = "name") {
  const map = new Map((await listAll(resource)).map((row) => [row[key], row.id]));
  const missing = items.filter((item) => item[key] !== undefined && !map.has(item[key]));

  for (const item of missing) await create(resource, item);

  for (const row of await listAll(resource)) {
    if (!map.has(row[key])) map.set(row[key], row.id);
  }

  return map;
}

const idsFor = (map, names) => names.map((name) => map.get(name)).filter((id) => typeof id === "number");

/** Singleton resources are only created when the table is empty. */
async function seedOnce(resource, items, key) {
  const existing = await listAll(resource);
  if (existing.length > 0) {
    console.log(`\n${resource} already has ${existing.length} row(s) — skipping.`);
    return;
  }
  for (const item of items) await create(resource, item);
}

/* -------------------------------------------------------------------- run */

async function seed() {
  console.log(`Seeding ${API_BASE} with real CV data...\n`);

  // Every create below needs a token, so there is nothing to do until this succeeds.
  await signIn();

  console.log("Reference data");
  const typeIds = await ensureMany("Types", TYPES);
  const categoryIds = await ensureMany("Categories", CATEGORIES);
  const tagIds = await ensureMany("Tags", TAGS);
  const technologyIds = await ensureMany("Technologies", TECHNOLOGIES);

  console.log("\nSkills");
  await ensureMany(
    "Skills",
    SKILLS.map((skill) => ({
      name: skill.name,
      description: null,
      // The CV lists skills without proficiency ratings, so no level is claimed.
      proficiencyLevel: null,
      typeIds: idsFor(typeIds, skill.types),
    })),
  );

  console.log("\nProjects");
  await ensureMany(
    "Projects",
    PROJECTS.map((project) => ({
      title: project.title,
      description: project.description,
      shortDescription: project.shortDescription,
      githubUrl: project.githubUrl,
      liveDemoUrl: null,
      startDate: null,
      endDate: null,
      status: project.status,
      featured: project.featured,
      categoryIds: idsFor(categoryIds, project.categories),
      tagIds: idsFor(tagIds, project.tags),
      technologyIds: idsFor(technologyIds, project.technologies),
    })),
    "title",
  );

  console.log("\nProfile and content");
  await seedOnce("Profiles", PROFILES, "fullName");
  await seedOnce("SocialLinks", SOCIAL_LINKS, "platform");
  await seedOnce("Services", SERVICES, "title");
  await seedOnce("Experiences", EXPERIENCES, "jobTitle");
  await seedOnce("Educations", EDUCATIONS, "institutionName");
  await seedOnce("Certifications", CERTIFICATIONS, "name");
  await seedOnce("Achievements", ACHIEVEMENTS, "title");
  await seedOnce("Resumes", RESUMES, "title");

  console.log("\nDone. Portfolio content is now served by the API.");
}

seed().catch((error) => {
  console.error("\nSeed failed:", error.message);
  process.exit(1);
});