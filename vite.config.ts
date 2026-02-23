import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // DO NOT force port 3000 (vercel dev uses it)
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: "dist"
  }
});