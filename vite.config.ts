import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        test: resolve(__dirname, "worker-test.html"),
      },
    },
  },
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
