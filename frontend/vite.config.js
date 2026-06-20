import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth: register / login / me.
      "/auth": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/run": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/chat": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
        // /chat is BOTH a frontend route (the chat page) and a backend API
        // (POST /chat). Let browser navigations to the page fall through to the
        // SPA; only proxy the actual API calls (POST / fetch) to the backend.
        bypass(req) {
          if (req.method === "GET" && (req.headers.accept || "").includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/estimate_hospital": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/analyze_report": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      // Live voice dictation — WebSocket, so ws:true to tunnel the upgrade.
      "/ws/transcribe": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
