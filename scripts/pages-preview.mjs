/*
 * Emulates GitHub Pages for local verification: serves dist/ under a subpath and answers any
 * unknown path with 404.html, which is exactly what Pages does for a client-side route.
 *
 *   node scripts/pages-preview.mjs [port]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "dist");
const PORT = Number(process.argv[2] || 8899);
const BASE = "/MyPortfolio-FrontEndProject";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

async function readIfFile(p) {
  try {
    const info = await stat(p);
    return info.isFile() ? await readFile(p) : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);

  if (path === BASE || path === `${BASE}/`) {
    const body = await readIfFile(join(ROOT, "index.html"));
    res.writeHead(200, { "content-type": TYPES[".html"] });
    res.end(body);
    return;
  }

  const direct = await readIfFile(join(ROOT, path.slice(BASE.length)));
  if (direct) {
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(direct);
    return;
  }

  const fallback = await readIfFile(join(ROOT, "404.html"));
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(fallback);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}${BASE}/`);
});