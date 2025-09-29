import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/web/",
  plugins: [react()], // El plugin de Cloudflare ha sido eliminado
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});