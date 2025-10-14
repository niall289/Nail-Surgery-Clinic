import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build the client into dist/public so the Node server can serve it
export default defineConfig({
  plugins: [react()],
  root: "client",
  server: {
    // dev server (when running vite directly)
    port: 5173,
    strictPort: true,
    // proxy API to your Node server (uses PORT or 5021)
    proxy: { "/api": `http://127.0.0.1:${process.env.PORT || 5021}` },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    // absolute path so it doesn’t depend on root
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "client/index.html"),
    },
  },
});
