#!/usr/bin/env node
/**
 * Verifies a live import against ./portfolio-content.mjs.
 *
 * Where verify-content.mjs checks the content offline, this checks what the API actually serves
 * after scripts/seed.mjs has run: every expected record is present exactly once, its relations
 * resolved, and every attachment URL the server handed back is fetchable.
 *
 * The attachment check is the one that matters. The server stores each upload under its own GUID
 * and turns the stored path into a URL through a value resolver, so a row can look perfect while
 * the file behind it 404s. Nothing here writes.
 *
 *   npm run verify:api
 *   API_BASE=https://mohamedwalid.runasp.net/api npm run verify:api
 */

import {
  ACHIEVEMENTS,
  BLOG_POSTS,
  CATEGORIES,
  CERTIFICATIONS,
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

const API_BASE = (process.env.API_BASE || "http://localhost:5022/api").replace(/\/+$/, "");
const ORIGIN = new URL(API_BASE).origin;

let failures = 0;
let checks = 0;

const probedUrls = new Set();

function check(label, condition, detail = "") {
  checks += 1;
  if (!condition) failures += 1;
  console.log(`  [${condition ? "PASS" : "FAIL"}] ${label}${detail ? ` -- ${detail}` : ""}`);
}

function section(title) {
  console.log(`\n${title}`);
}

async function api(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });

  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);

  return response.json();
}

async function listAll(resource) {
  const collected = [];
  let pageIndex = 1;
  let totalPages = 1;

  do {
    const page = await api(`/${resource}?pageIndex=${pageIndex}&pageSize=100`);
    collected.push(...(page.data ?? []));
    totalPages = page.totalPages ?? 1;
    pageIndex += 1;
  } while (pageIndex <= totalPages);

  return collected;
}

const DOTTED_HOST = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?::\d+)?$/i;
const HOST_WITH_PORT = /^[a-z0-9-]+(?::\d+)?$/i;

/**
 * True for the scheme-less absolute URLs the backend emits, e.g.
 * `mohamedwalid.runasp.net/Files/images/profile/x.jpg`. The `/` is what separates a host from a
 * plain file name, so `graduation.jpg` is not treated as a host.
 */
function isSchemeLessHost(value) {
  const slash = value.indexOf("/");
  if (slash <= 0) return false;

  const host = value.slice(0, slash);

  return DOTTED_HOST.test(host) || (host.includes(":") && HOST_WITH_PORT.test(host));
}

/**
 * Resolves a stored path the same way the frontend does, so this script fails when the URL shape
 * changes rather than when a file happens to be missing.
 */
function resolveUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  // The backend emits `<Urls:BaseUrl>/Files/<path>` without a scheme. Treating it as a relative
  // path would build `https://host/host/Files/...` and 404 on a file that is actually served, which
  // is exactly what src/lib/media.ts guards against.
  if (isSchemeLessHost(trimmed)) return `https://${trimmed}`;

  if (trimmed.startsWith("/")) return `${ORIGIN}${trimmed}`;

  return `${ORIGIN}/${trimmed}`;
}

/** Fetches each distinct attachment URL once; repeats are reported without a second request. */
async function assertAttachment(label, value) {
  const url = resolveUrl(value);

  if (!url) {
    check(`${label} has an image`, false, "no URL was stored");
    return;
  }

  if (probedUrls.has(url)) {
    check(`${label} URL resolves`, true, "already verified");
    return;
  }

  probedUrls.add(url);

  try {
    const response = await fetch(url);
    check(`${label} URL resolves`, response.ok, `${response.status} ${url}`);

    const type = response.headers.get("content-type") ?? "";
    // `application/pdf` carries no trailing slash, so it cannot share the `image/` and `video/`
    // prefix pattern; \b keeps it from also matching a hypothetical `application/pdfx`.
    const renderable = /^(image|video)\//i.test(type) || /^application\/pdf\b/i.test(type);

    check(`${label} is served as an image or document`, renderable, type);
  } catch (error) {
    check(`${label} URL resolves`, false, `${url} (${error.message})`);
  }
}

function assertNoPlaceholders(label, text) {
  const suspicious = ["aloo", "gobi", "lorem ipsum", "placeholder", "test test", "todo", "tbd", "xxx"];

  const found = suspicious.filter((needle) => String(text ?? "").toLowerCase().includes(needle));

  check(`${label} contains no placeholder text`, found.length === 0, found.join(", "));
}

async function main() {
  console.log(`Verifying ${API_BASE}`);

  /* -------------------------------------------------------------- counts */
  section("1. Record counts");
  const expected = {
    Types: TYPES.length,
    Categories: CATEGORIES.length,
    Tags: TAGS.length,
    Technologies: TECHNOLOGIES.length,
    Skills: SKILLS.length,
    Services: SERVICES.length,
    Experiences: EXPERIENCES.length,
    Educations: EDUCATIONS.length,
    Certifications: CERTIFICATIONS.length,
    Achievements: ACHIEVEMENTS.length,
    SocialLinks: SOCIAL_LINKS.length,
    Resumes: RESUMES.length,
    Projects: PROJECTS.length,
    BlogPosts: BLOG_POSTS.length,
  };

  const data = {};

  for (const [resource, count] of Object.entries(expected)) {
    const rows = await listAll(resource);
    data[resource] = rows;
    check(`${resource} holds exactly ${count}`, rows.length === count, `found ${rows.length}`);
  }

  const profiles = await listAll("Profiles");
  check("Profiles holds exactly 1", profiles.length === 1, `found ${profiles.length}`);

  const galleryExpected = PROJECTS.reduce((total, project) => total + project.gallery.length, 0);
  const gallery = await listAll("ProjectImages");
  check(`ProjectImages holds exactly ${galleryExpected}`, gallery.length === galleryExpected, `found ${gallery.length}`);

  /* ------------------------------------------------------------- profile */
  section("2. Profile");
  const profile = profiles[0];

  if (profile) {
    check("full name matches the CV", profile.fullName === PROFILE.fullName, profile.fullName);
    check("professional title matches", profile.professionalTitle === PROFILE.professionalTitle);
    check("email matches the CV", profile.email === PROFILE.email);
    check("phone matches the CV", profile.phone === PROFILE.phone);
    check("location is set", Boolean(profile.location?.trim()), profile.location);
    check("bio is substantial", (profile.bio ?? "").length > 200, `${(profile.bio ?? "").length} characters`);
    assertNoPlaceholders("bio", profile.bio);

    await assertAttachment("profile photo", profile.profileImageUrl);
    await assertAttachment("about image", profile.aboutImageUrl);
  }

  /* ------------------------------------------------------ reference data */
  section("3. Reference data");
  const typeNames = new Set(data.Types.map((row) => row.name));
  const categoryNames = new Set(data.Categories.map((row) => row.name));
  const tagNames = new Set(data.Tags.map((row) => row.name));
  const technologyNames = new Set(data.Technologies.map((row) => row.name));

  check("every skill type imported", TYPES.every((type) => typeNames.has(type.name)));
  check("every category imported", CATEGORIES.every((c) => categoryNames.has(c.name)));
  check("every tag imported", TAGS.every((tag) => tagNames.has(tag.name)));
  check("every technology imported", TECHNOLOGIES.every((t) => technologyNames.has(t.name)));

  const slugs = data.Categories.map((row) => row.slug);
  check("category slugs are unique", new Set(slugs).size === slugs.length);

  /* -------------------------------------------------------------- skills */
  section("4. Skills");
  for (const skill of SKILLS) {
    const row = data.Skills.find((candidate) => candidate.name === skill.name);
    if (!row) {
      check(`skill ${skill.name} exists`, false);
      continue;
    }

    const attached = new Set((row.types ?? []).map((type) => type.name));
    const missing = skill.types.filter((name) => !attached.has(name));

    check(`skill ${skill.name} is attached to its types`, missing.length === 0, missing.join(", "));
    check(`skill ${skill.name} has a description`, Boolean(row.description?.trim()));
  }

  /* ------------------------------------------------------------ services */
  section("5. Services");
  for (const service of SERVICES) {
    const row = data.Services.find((candidate) => candidate.title === service.title);

    check(`service ${service.title} is active`, row?.isActive === true, `isActive=${row?.isActive}`);
    check(`service ${service.title} is in display order ${service.displayOrder}`, row?.displayOrder === service.displayOrder, `${row?.displayOrder}`);
  }

  /* -------------------------------------------------- experience, school */
  section("6. Experience, education, certification, achievements");
  for (const job of EXPERIENCES) {
    const row = data.Experiences.find((candidate) => candidate.jobTitle === job.jobTitle);
    check(`experience ${job.jobTitle} exists`, Boolean(row));
    check(`experience ${job.jobTitle} has a description`, (row?.description ?? "").length > 100);
    await assertAttachment(`experience ${job.companyName} logo`, row?.companyLogoUrl);
  }

  for (const school of EDUCATIONS) {
    const row = data.Educations.find((candidate) => candidate.institutionName === school.institutionName);
    check(`education ${school.institutionName} exists`, Boolean(row));
    check(`education ${school.institutionName} states its degree`, Boolean(row?.degree?.trim()));
    await assertAttachment(`education ${school.institutionName} logo`, row?.institutionLogoUrl);
  }

  for (const certification of CERTIFICATIONS) {
    const row = data.Certifications.find((candidate) => candidate.name === certification.name);
    check(`certification ${certification.name} exists`, Boolean(row));
    check(`certification ${certification.name} names its issuer`, Boolean(row?.issuingOrganization?.trim()));
  }

  for (const achievement of ACHIEVEMENTS) {
    const row = data.Achievements.find((candidate) => candidate.title === achievement.title);
    check(`achievement ${achievement.title} exists`, Boolean(row));
    if (achievement.image) await assertAttachment(`achievement ${achievement.title} image`, row?.imageUrl);
  }

  /* ------------------------------------------------------- social, resume */
  section("7. Social links and resume");
  for (const link of SOCIAL_LINKS) {
    const row = data.SocialLinks.find((candidate) => candidate.platform === link.platform);
    check(`${link.platform} link exists`, Boolean(row));
    check(`${link.platform} URL matches the source`, row?.url === link.url, row?.url);
    await assertAttachment(`${link.platform} icon`, row?.iconUrl);
  }

  const activeResume = data.Resumes.filter((row) => row.isActive);
  check("exactly one resume is active", activeResume.length === 1, `${activeResume.length} active`);
  check("the active resume has a file", Boolean(resolveUrl(activeResume[0]?.fileUrl)), activeResume[0]?.fileUrl);
  await assertAttachment("resume PDF", activeResume[0]?.fileUrl);

  /* ------------------------------------------------------------ projects */
  section("8. Projects and galleries");
  for (const project of PROJECTS) {
    const row = data.Projects.find((candidate) => candidate.title === project.title);

    if (!row) {
      check(`project ${project.title} exists`, false);
      continue;
    }

    check(`project ${project.title} is featured=${project.featured}`, row.featured === project.featured);
    check(`project ${project.title} has a short description`, (row.shortDescription ?? "").length > 60);
    check(`project ${project.title} body is substantial`, (row.description ?? "").length > 300, `${(row.description ?? "").length} characters`);
    assertNoPlaceholders(`${project.title} description`, row.description);
    check(`project ${project.title} has no invented dates`, !row.startDate && !row.endDate, `${row.startDate} .. ${row.endDate}`);

    const categories = new Set((row.categories ?? []).map((category) => category.name));
    const tags = new Set((row.tags ?? []).map((tag) => tag.name));
    const technologies = new Set((row.technologies ?? []).map((technology) => technology.name));

    check(`project ${project.title} has its categories`, project.categories.every((name) => categories.has(name)),
      project.categories.filter((name) => !categories.has(name)).join(", "));
    check(`project ${project.title} has its tags`, project.tags.every((name) => tags.has(name)),
      project.tags.filter((name) => !tags.has(name)).join(", "));
    check(`project ${project.title} has its technologies`, project.technologies.every((name) => technologies.has(name)),
      project.technologies.filter((name) => !technologies.has(name)).join(", "));

    await assertAttachment(`${project.title} cover`, row.imageUrl);

    const images = gallery.filter((image) => image.projectId === row.id);
    check(`project ${project.title} gallery has ${project.gallery.length} images`, images.length === project.gallery.length, `${images.length}`);

    const orders = images.map((image) => Number(image.displayOrder)).sort((a, b) => a - b);
    check(`project ${project.title} gallery is ordered 1..n`,
      orders.join(",") === orders.map((_, index) => index + 1).join(","), orders.join(","));

    for (const image of images) {
      await assertAttachment(`${project.title} / ${image.caption}`, image.imageUrl);
    }
  }

  const featured = data.Projects.filter((row) => row.featured);
  const featuredEndpoint = await api("/Projects/featured");
  check("GET /Projects/featured agrees with the featured flag", featuredEndpoint.length === featured.length,
    `${featuredEndpoint.length} featured via the endpoint`);

  /* ------------------------------------------------------------ blogposts */
  section("9. Blog posts");
  for (const post of BLOG_POSTS) {
    const row = data.BlogPosts.find((candidate) => candidate.title === post.title);

    if (!row) {
      check(`blog post ${post.title} exists`, false);
      continue;
    }

    check(`blog post ${post.title} is published`, row.status === "Published", row.status);
    check(`blog post ${post.title} has a slug`, Boolean(row.slug?.trim()), row.slug);
    check(`blog post ${post.title} has a reading time`, row.readingTime > 0, `${row.readingTime} min`);
    check(`blog post ${post.title} has a published date`, Boolean(row.publishedAt), row.publishedAt);
    check(`blog post ${post.title} body is substantial`, (row.content ?? "").length > 1000, `${(row.content ?? "").length} characters`);
    assertNoPlaceholders(`${post.title} content`, row.content);

    await assertAttachment(`blog cover: ${post.title}`, row.coverImageUrl);
  }

  const slugsUsed = data.BlogPosts.map((row) => row.slug);
  check("blog slugs are unique", new Set(slugsUsed).size === slugsUsed.length);

  /* -------------------------------------------------------------- summary */
  console.log("\n----------------------------------------");
  console.log(`${probedUrls.size} distinct attachment URLs fetched`);
  console.log(`${checks - failures}/${checks} checks passed`);

  if (failures) {
    console.log(`\n${failures} check(s) failed.`);
    process.exit(1);
  }

  console.log("\nThe API is serving the imported content, and every stored file resolves.");
}

main().catch((error) => {
  console.error("\nverify:api errored:", error.message);
  process.exit(1);
});