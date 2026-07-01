import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.DEV_API_PROXY_TARGET ?? "http://localhost:1337",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.DEV_API_PROXY_TARGET ?? "http://localhost:1337",
          changeOrigin: true,
        },
      },
    },
  };
});
