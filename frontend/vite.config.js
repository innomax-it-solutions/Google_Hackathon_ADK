import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Subdirectory base ONLY for production builds (the sister-company cPanel
  // deploy serves the app from /MVTBridge/frontend/). Local dev runs at the
  // root so http://localhost:5173/ and /doctors work without the subpath.
  base: command === "build" ? "/MVTBridge/frontend/" : "/",

  plugins: [react()],

  server: {
    proxy: {
      "/run": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/chat": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
        bypass(req) {
          if (
            req.method === "GET" &&
            (req.headers.accept || "").includes("text/html")
          ) {
            return "/index.html";
          }
        },
      },
      "/estimate_hospital": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws/transcribe": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
}));