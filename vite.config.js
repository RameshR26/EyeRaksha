import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/dataset_raw/**",
        "**/dataset/**",
        "**/matlab_dataset/**",
        "**/models/**",
        "**/results/**",
        "**/reports/**",
        "**/training_results/**",
        "**/evaluation_results/**"
      ]
    },
    proxy: {
      "/api": "http://127.0.0.1:8080",
      "/results": "http://127.0.0.1:8080"
    }
  }
});