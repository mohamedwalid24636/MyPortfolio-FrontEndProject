/*
 * Verifies the admin write path against a live API: multipart upload, the URL the server hands
 * back for the stored file, and delete.
 *
 * Everything it creates is removed again, so it is safe to point at the deployed backend.
 *
 *   API_BASE=https://mohamedwalid.runasp.net/api \
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/verify-integration.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(HERE, "..", "public");

const API_BASE = (process.env.API_BASE || "https://mohamedwalid.runasp.net/api").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".pdf": "application/pdf" };

let token = null;
let createdId = null;
let failures = 0;

function check(label, condition, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`  [${status}] ${label}${detail ? ` -- ${detail}` : ""}`);
}

async function api(path, { method = "GET", form, json } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { method, headers };
  if (form) init.body = form;
  else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
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
  return { status: response.status, body: parsed };
}

async function appendFile(form, relativePath, fieldName) {
  const bytes = await readFile(join(PUBLIC_DIR, relativePath));
  const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
  const type = MIME[name.slice(name.lastIndexOf(".")).toLowerCase()] || "application/octet-stream";
  form.append(fieldName, new File([bytes], name, { type }));
  return form;
}

function resolveImageUrl(url, assetOrigin) {
  if (typeof url !== "string" || url.trim().length === 0) return "data:image/svg+xml,fallback";
  const value = url.trim();
  if (/^data:/i.test(value) || /^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  const slash = value.indexOf("/");
  if (slash > 0) {
    const host = value.slice(0, slash);
    const dotted = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?::\d+)?$/i.test(host);
    const withPort = host.includes(":") && /^[a-z0-9-]+(?::\d+)?$/i.test(host);
    if (dotted || withPort) return `https://${value}`;
  }
  if (value.startsWith("/")) return assetOrigin ? `${assetOrigin}${value}` : value;
  return `/MyPortfolio-FrontEndProject/${value}`;
}

const ASSET_ORIGIN = new URL(API_BASE).origin;

async function main() {
  console.log(`Verifying ${API_BASE}\n`);

  /* ------------------------------------------------------------ 1. auth */
  console.log("1. Authentication");
  const login = await api("/auth/login", {
    method: "POST",
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  check("POST /auth/login returns 200", login.status === 200, `status ${login.status}`);
  check("response carries a token", typeof login.body?.token === "string" && login.body.token.length > 0);
  check("response carries expiresAtUtc", typeof login.body?.expiresAtUtc === "string");
  check("response carries email", typeof login.body?.email === "string");
  if (login.status !== 200 || !login.body?.token) {
    console.log("\nCannot continue without a token.");
    process.exit(1);
  }
  token = login.body.token;

  const bad = await api("/auth/login", { method: "POST", json: { email: ADMIN_EMAIL, password: "wrong" } });
  check("wrong password is refused with 401", bad.status === 401, `status ${bad.status}`);

  // api() attaches the token, so the anonymous case has to be requested without it.
  const anonymous = await fetch(`${API_BASE}/ContactMessages?pageIndex=1&pageSize=1`, {
    headers: { Accept: "application/json" },
  });
  check("protected endpoint rejects an anonymous read", anonymous.status === 401, `status ${anonymous.status}`);

  /* ------------------------------------------------- 2. public read surface */
  console.log("\n2. Public reads");
  const resources = [
    "Achievements", "BlogPosts", "Certifications", "Educations", "Experiences",
    "Projects", "Resumes", "Services", "Skills", "SocialLinks", "Technologies", "Types",
  ];
  for (const resource of resources) {
    const res = await api(`/${resource}?pageIndex=1&pageSize=2`);
    const ok = res.status === 200 && Array.isArray(res.body?.data) && typeof res.body?.totalCount === "number";
    check(`GET /${resource} returns a pagination envelope`, ok, `status ${res.status}`);
  }

  const profile = await api("/Profiles?pageIndex=1&pageSize=1");
  check("GET /Profiles is paginated", profile.status === 200 && Array.isArray(profile.body?.data));

  const featured = await api("/Projects/featured");
  check("GET /Projects/featured returns a bare array", featured.status === 200 && Array.isArray(featured.body), `status ${featured.status}`);

  const active = await api("/Resumes/active");
  check("GET /Resumes/active is 200 or 404", active.status === 200 || active.status === 404, `status ${active.status}`);

  const missing = await api("/Projects/99999999");
  check("GET /Projects/{unknown id} is 404", missing.status === 404, `status ${missing.status}`);

  /* ------------------------------------------ 3. multipart write + image URL */
  console.log("\n3. Multipart upload and returned file URL");
  const form = new FormData();
  form.append("fullName", "Verification Probe");
  form.append("professionalTitle", "Temporary");
  form.append("bio", "Created by scripts/verify-integration.mjs and deleted immediately after.");
  form.append("location", "Giza, Egypt");
  form.append("email", "probe@example.com");
  form.append("phone", "+201000000000");
  form.append("yearsOfExperience", "1");
  await appendFile(form, "assets/images/profile.jpg", "image");

  const created = await api("/Profiles", { method: "POST", form });
  check("POST /Profiles (multipart) returns 201", created.status === 201, `status ${created.status} ${JSON.stringify(created.body).slice(0, 200)}`);
  createdId = created.body?.id ?? null;

  if (createdId) {
    const dto = created.body;
    console.log(`      raw profileImageUrl = ${JSON.stringify(dto.profileImageUrl)}`);

    check("server returned a profile image URL", typeof dto.profileImageUrl === "string" && dto.profileImageUrl.length > 0);

    const resolved = resolveImageUrl(dto.profileImageUrl, ASSET_ORIGIN);
    console.log(`      resolved           = ${resolved}`);

    const fetchable = await fetch(resolved);
    check("resolved image URL is actually fetchable", fetchable.ok, `status ${fetchable.status} for ${resolved}`);
    check("resolved URL points at the backend origin", resolved.startsWith(ASSET_ORIGIN), resolved);

    const readBack = await api(`/Profiles/${createdId}`);
    check("GET /Profiles/{id} returns the created row", readBack.status === 200 && readBack.body?.id === createdId);

    const updated = new FormData();
    updated.append("fullName", "Verification Probe (edited)");
    updated.append("professionalTitle", "Temporary");
    updated.append("bio", "Edited by scripts/verify-integration.mjs.");
    updated.append("location", "Giza, Egypt");
    updated.append("email", "probe@example.com");
    updated.append("phone", "+201000000000");
    updated.append("yearsOfExperience", "1");
    const put = await api(`/Profiles/${createdId}`, { method: "PUT", form: updated });
    check("PUT /Profiles/{id} returns 204", put.status === 204, `status ${put.status}`);

    const afterPut = await api(`/Profiles/${createdId}`);
    check("update was persisted", afterPut.body?.fullName === "Verification Probe (edited)", afterPut.body?.fullName);

    const del = await api(`/Profiles/${createdId}`, { method: "DELETE" });
    check("DELETE /Profiles/{id} returns 204", del.status === 204, `status ${del.status}`);
    createdId = null;

    const gone = await api(`/Profiles/${afterPut.body?.id}`);
    check("deleted row is gone (404)", gone.status === 404, `status ${gone.status}`);
  }

  /* -------------------------------------------------------- 4. JSON writes */
  console.log("\n4. JSON writes (no upload)");
  const jsonCreate = await api("/Types", { method: "POST", json: { name: `VerificationProbe_${Date.now()}`, description: "temporary" } });
  check("POST /Types (JSON) returns 200/201", jsonCreate.status === 200 || jsonCreate.status === 201, `status ${jsonCreate.status}`);

  if (jsonCreate.body?.id) {
    const jsonId = jsonCreate.body.id;
    const jsonUpdate = await api(`/Types/${jsonId}`, { method: "PUT", json: { name: jsonCreate.body.name, description: "edited" } });
    check("PUT /Types/{id} (JSON) returns 204", jsonUpdate.status === 204, `status ${jsonUpdate.status}`);
    const jsonDelete = await api(`/Types/${jsonId}`, { method: "DELETE" });
    check("DELETE /Types/{id} returns 204", jsonDelete.status === 204, `status ${jsonDelete.status}`);
  }

  /* ----------------------------------------------------------- 5. CORS */
  console.log("\n5. CORS");
  const origin = "https://mohamedwalid24636.github.io";
  const simple = await fetch(`${API_BASE}/Projects?pageIndex=1&pageSize=1`, { headers: { Origin: origin } });
  check(
    `GET with Origin ${origin} is allowed`,
    simple.headers.get("access-control-allow-origin") === origin,
    `ACAO=${simple.headers.get("access-control-allow-origin")}`,
  );

  const preflight = await fetch(`${API_BASE}/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
  });
  check(
    "preflight from the Pages origin is allowed",
    preflight.headers.get("access-control-allow-origin") === origin,
    `ACAO=${preflight.headers.get("access-control-allow-origin")}`,
  );

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  if (createdId) {
    api(`/Profiles/${createdId}`, { method: "DELETE" }).finally(() => {
      console.error("\nVerification errored:", error.message);
      process.exit(1);
    });
    return;
  }
  console.error("\nVerification errored:", error.message);
  process.exit(1);
});