import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: "client",
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: ["*", ".replit.dev", ".replit.app"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true, // ✅ Ensures previous builds are wiped
    rollupOptions: {
      input: "client/index.html",
    },
  },
});
