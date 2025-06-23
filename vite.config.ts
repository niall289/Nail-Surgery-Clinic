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
    port: 3000,
    host: true,
    hmr: {
      protocol: "wss",
      host: "7e569394-b612-4912-b263-d84cf5cdc840-00-2qpsc2v9pfw9q.kirk.replit.dev",
      port: 443,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    allowedHosts: [
      "7e569394-b612-4912-b263-d84cf5cdc840-00-2qpsc2v9pfw9q.kirk.replit.dev"
    ]
  },
});
