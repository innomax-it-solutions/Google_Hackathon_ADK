import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/MVTBridge/frontend/",

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
});