import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "../FootCarePortal-1/shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@components": path.resolve(import.meta.dirname, "client", "src", "components"),
      "@components/ui": path.resolve(import.meta.dirname, "client", "src", "components", "ui"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      "c16b3eaf-2dc7-4318-9492-81b2d78892e6-00-33cjkltnkrj51.kirk.replit.dev",
      "74a5c1c6-354f-49ed-a2f9-4221388929da-00-d532ej2acf3p.picard.replit.dev"
    ]
  },
});
