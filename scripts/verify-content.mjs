#!/usr/bin/env node
/**
 * Static check of ./portfolio-content.mjs against the raw material it claims to come from.
 *
 * It needs no backend and writes nothing, so it can be run before the importer — a missing
 * screenshot, a duplicate name or a relation that resolves to nothing is caught here rather than
 * half way through a live import.
 *
 *   npm run verify:content
 */

import { stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
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
const NEEDED_DATA_DIR = resolve(process.env.NEEDED_DATA_DIR || join(APP_DIR, "..", "NeededData"));

let failures = 0;
let checks = 0;

function check(label, condition, detail = "") {
  checks += 1;
  if (!condition) failures += 1;
  console.log(`  [${condition ? "PASS" : "FAIL"}] ${label}${detail ? ` -- ${detail}` : ""}`);
}

function section(title) {
  console.log(`\n${title}`);
}

function assetPath(spec) {
  const prefix = "@asset:";

  if (!spec.startsWith(prefix)) {
    return join(NEEDED_DATA_DIR, ...spec.split("/").filter(Boolean));
  }

  return join(APP_DIR, ...spec.slice(prefix.length).split("/").filter(Boolean));
}

/** A file the content claims to have imported has to exist on disk. */
async function assertFile(label, spec) {
  if (!spec) {
    check(`${label} has no file reference`, false, "nothing to upload");
    return;
  }

  try {
    const info = await stat(assetPath(spec));
    check(`${label} exists`, info.isFile() && info.size > 0, `${spec} (${(info.size / 1024).toFixed(0)} KB)`);
  } catch {
    check(`${label} exists`, false, `missing: ${spec}`);
  }
}

function assertUnique(label, items, keyOf) {
  const seen = new Map();

  for (const item of items) {
    const key = keyOf(item).toLowerCase();
    if (seen.has(key)) {
      check(`${label} are unique`, false, `"${keyOf(item)}" appears twice`);
      return;
    }
    seen.set(key, true);
  }

  check(`${label} are unique`, true, `${items.length}`);
}

function assertRequired(label, item, fields) {
  const missing = fields.filter((field) => {
    const value = item[field];
    return value === undefined || value === null || (typeof value === "string" && value.trim().length === 0);
  });

  check(`${label} has every required field`, missing.length === 0, missing.length ? `missing ${missing.join(", ")}` : "");
}

const typeNames = new Set(TYPES.map((type) => type.name));
const categoryNames = new Set(CATEGORIES.map((category) => category.name));
const tagNames = new Set(TAGS.map((tag) => tag.name));
const technologyNames = new Set(TECHNOLOGIES.map((technology) => technology.name));

async function main() {
  console.log(`Checking portfolio content against ${NEEDED_DATA_DIR}`);

  /* ------------------------------------------------------------ taxonomy */
  section("1. Reference data");
  assertUnique("skill types", TYPES, (type) => type.name);
  assertUnique("categories", CATEGORIES, (category) => category.name);
  assertUnique("tags", TAGS, (tag) => tag.name);
  assertUnique("technologies", TECHNOLOGIES, (technology) => technology.name);

  check("every category slug is unique", new Set(CATEGORIES.map((c) => c.slug)).size === CATEGORIES.length);
  check("every tag slug is unique", new Set(TAGS.map((t) => t.slug)).size === TAGS.length);

  const untyped = SKILLS.filter((skill) => !skill.types?.length).map((skill) => skill.name);
  check("every skill declares a type", untyped.length === 0, untyped.join(", "));

  const unknownTypes = SKILLS.flatMap((skill) =>
    (skill.types ?? []).filter((type) => !typeNames.has(type)).map((type) => `${skill.name} -> ${type}`),
  );
  check("every skill type resolves", unknownTypes.length === 0, unknownTypes.join(", "));

  const undescribed = SKILLS.filter((skill) => !skill.description?.trim()).map((skill) => skill.name);
  check("every skill has a description", undescribed.length === 0, undescribed.join(", "));

  /* --------------------------------------------------------------- skills */
  section("2. Skills");
  assertUnique("skills", SKILLS, (skill) => skill.name);
  check("no skill states a proficiency level", SKILLS.every((skill) => skill.proficiencyLevel === undefined),
    "the source material has no levels, and the UI renders a bar from them");

  /* ------------------------------------------------------------- projects */
  section("3. Projects");
  assertUnique("projects", PROJECTS, (project) => project.title);
  assertUnique("project keys", PROJECTS, (project) => project.key);

  for (const project of PROJECTS) {
    assertRequired(`${project.title}`, project, ["title", "shortDescription", "description", "status", "categories"]);
    check(`${project.title} is in a known category`,
      project.categories.every((name) => categoryNames.has(name)),
      project.categories.filter((name) => !categoryNames.has(name)).join(", "));
    check(`${project.title} tags resolve`,
      project.tags.every((name) => tagNames.has(name)),
      project.tags.filter((name) => !tagNames.has(name)).join(", "));
    check(`${project.title} technologies resolve`,
      project.technologies.every((name) => technologyNames.has(name)),
      project.technologies.filter((name) => !technologyNames.has(name)).join(", "));
    check(`${project.title} states no project dates`, project.startDate === null && project.endDate === null,
      "no source file gives them (A4)");

    const captions = new Set();
    const duplicateCaptions = project.gallery.filter((image) => {
      if (captions.has(image.caption.toLowerCase())) return true;
      captions.add(image.caption.toLowerCase());
      return false;
    });
    check(`${project.title} gallery captions are unique`, duplicateCaptions.length === 0,
      duplicateCaptions.map((image) => image.caption).join(", "));
  }

  const featured = PROJECTS.filter((project) => project.featured);
  check("at least one project is featured", featured.length > 0, `${featured.length} featured`);

  console.log("\n4. Project covers and galleries");
  let galleryTotal = 0;
  let uploadTotal = 0;

  for (const project of PROJECTS) {
    await assertFile(`${project.title} cover`, project.cover);
    uploadTotal += 1;

    for (const image of project.gallery) {
      await assertFile(`${project.title} gallery: ${image.caption}`, image.file);
      uploadTotal += 1;
    }

    galleryTotal += project.gallery.length;
  }

  check("every project has at least a cover", PROJECTS.every((project) => Boolean(project.cover)));

  /* ------------------------------------------------------------- profile */
  section("5. Profile, social links and resume");
  assertRequired("profile", PROFILE, ["fullName", "professionalTitle", "bio", "location", "phone", "email"]);
  await assertFile("profile photo", PROFILE.image);
  await assertFile("about image", PROFILE.aboutImage);

  assertUnique("social links", SOCIAL_LINKS, (link) => link.platform);
  for (const link of SOCIAL_LINKS) {
    await assertFile(`${link.platform} icon`, link.icon);
    check(`${link.platform} has a URL`, Boolean(link.url?.trim()));
  }

  assertUnique("resumes", RESUMES, (resume) => resume.title);
  check("exactly one resume is active", RESUMES.filter((resume) => resume.isActive).length === 1);
  for (const resume of RESUMES) await assertFile(`resume file: ${resume.title}`, resume.file);

  /* ------------------------------------------- experience, education, rest */
  section("6. Experience, education, certifications and achievements");
  for (const job of EXPERIENCES) {
    assertRequired(`experience ${job.jobTitle}`, job, ["jobTitle", "companyName", "description"]);
    await assertFile(`${job.companyName} logo`, job.logo);
  }

  for (const school of EDUCATIONS) {
    assertRequired(`education ${school.institutionName}`, school, ["institutionName", "degree", "description"]);
    await assertFile(`${school.institutionName} logo`, school.logo);
  }

  assertUnique("certifications", CERTIFICATIONS, (certification) => certification.name);
  for (const certification of CERTIFICATIONS) {
    assertRequired(`certification ${certification.name}`, certification, ["name", "issuingOrganization"]);
  }

  assertUnique("achievements", ACHIEVEMENTS, (achievement) => achievement.title);
  for (const achievement of ACHIEVEMENTS) {
    assertRequired(`achievement ${achievement.title}`, achievement, ["title", "description"]);
    if (achievement.image) await assertFile(`${achievement.title} image`, achievement.image);
  }

  section("7. Services");
  assertUnique("services", SERVICES, (service) => service.title);
  check("service display order is 1..n", SERVICES.map((service) => service.displayOrder).join(",") ===
    SERVICES.map((_, index) => index + 1).join(","));

  /* ---------------------------------------------------------- blog posts */
  section("8. Blog posts");
  assertUnique("blog posts", BLOG_POSTS, (post) => post.title);
  assertUnique("blog post keys", BLOG_POSTS, (post) => post.key);

  for (const post of BLOG_POSTS) {
    assertRequired(`blog post ${post.title}`, post, ["title", "shortDescription", "content", "status"]);
    await assertFile(`blog cover: ${post.title}`, post.cover);
    check(`${post.title} is published`, post.status === "Published");

    const words = post.content.split(/\s+/).filter(Boolean).length;
    check(`${post.title} has a readable body`, words >= 250, `${words} words`);
  }

  /* ------------------------------------------------------------- summary */
  console.log("\n----------------------------------------");
  console.log(`content model: 7 projects, ${galleryTotal} gallery images, ${uploadTotal} uploads planned`);
  console.log(`${checks - failures}/${checks} checks passed`);

  if (failures) {
    console.log(`\n${failures} check(s) failed.`);
    process.exit(1);
  }

  console.log("\nContent is internally consistent and every referenced file exists.");
}

main().catch((error) => {
  console.error("\nverify:content errored:", error.message);
  process.exit(1);
});