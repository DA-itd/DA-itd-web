import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // 👈 importante para que funcione correctamente en GitHub Pages o rutas relativas
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
  },
});
