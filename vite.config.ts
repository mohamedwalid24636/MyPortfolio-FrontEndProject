import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Single place the backend origin is configured. Everything the browser needs (API calls and
  // attachment files) is forwarded here, so development never depends on CORS.
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5022";

  // GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so every emitted URL
  // has to be prefixed with that subpath. A user/organisation site (or local dev) uses "/", which is
  // also how a bare `VITE_BASE_PATH=/` is written — normalize first so the value can never collapse
  // into an invalid "//" base.
  const basePath = (env.VITE_BASE_PATH ?? "").replace(/^\/+|\/+$/g, "");
  const base = basePath ? `/${basePath}/` : "/";

  const proxy = {
    changeOrigin: true,
    // The dev certificate is self-signed.
    secure: false,
  };

  // Files in public/ are copied byte-for-byte and never see transformIndexHtml, so the base path is
  // stamped into the SPA fallback after the copy step instead.
  const basePathIn404Plugin = {
    name: "stamp-base-path-into-404",
    apply: "build" as const,
    closeBundle() {
      const target = path.resolve(import.meta.dirname, "dist", "404.html");
      if (!fs.existsSync(target)) {
        throw new Error("dist/404.html is missing; deep links would 404 on GitHub Pages.");
      }
      const html = fs.readFileSync(target, "utf8");
      if (!html.includes("__BASE__")) return;
      fs.writeFileSync(target, html.replaceAll("__BASE__", base));
    },
  };

  return {
    // Must precede the plugins so the HTML transform already sees the base path.
    base,
    plugins: [basePathIn404Plugin, react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        // REST endpoints: /api/...
        "/api": { target: apiTarget, ...proxy },
        // Attachment files: the backend serves its own upload folder from /Files (see
        // Attachments:RequestPath). Attachment URLs handed out by the API are root-relative, so
        // they must be proxied too — the frontend never builds a filesystem path.
        "/Files": { target: apiTarget, ...proxy },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        "/api": { target: apiTarget, ...proxy },
        "/Files": { target: apiTarget, ...proxy },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 900,
    },
  };
});