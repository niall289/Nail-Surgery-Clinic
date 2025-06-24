import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@lib": path.resolve(__dirname, "client/src/lib"),
    },
  },
  root: "client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://etea-multi-clinic-portal-nialldmcdowell.replit.app",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      "7e569394-b612-4912-b263-d84cf5cdc840-00-2qpsc2v9pfw9q.kirk.replit.dev",
      "7e569394-b612-4912-b263-d84cf5cdc840-00-2qpsc2v9pfw9q.replit.dev",
    ],
  },
});
