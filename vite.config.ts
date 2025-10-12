import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root is the client app, build into server's public folder for production
export default defineConfig({
  plugins: [react()],
  root: "client",
  server: {
    // Keep the dev server separate from the API server
    port: 5173,
    strictPort: true,
    // Proxy API calls to the Node server running on PORT from env or default 5021
    proxy: { "/api": `http://127.0.0.1:${process.env.PORT || 5021}` },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    rollupOptions: {
      input: "client/index.html",
    },
  },
});
