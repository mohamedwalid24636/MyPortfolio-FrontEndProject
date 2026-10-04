import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Single place the backend origin is configured. Everything the browser needs (API calls and
  // attachment files) is forwarded here, so development never depends on CORS.
  // Point VITE_API_PROXY_TARGET at the URL the API is actually listening on.
  const apiTarget = env.VITE_API_PROXY_TARGET || "https://localhost:7067";

  const proxy = {
    changeOrigin: true,
    // The dev certificate is self-signed.
    secure: false,
  };

  return {
    plugins: [react(), tailwindcss()],
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