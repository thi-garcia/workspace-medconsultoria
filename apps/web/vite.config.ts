import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4310,
    // Proxy do tRPC e Socket.IO para a API em dev (evita CORS e mantém cookie same-origin).
    proxy: {
      "/trpc": { target: "http://localhost:4319", changeOrigin: true },
      "/socket.io": { target: "http://localhost:4319", ws: true, changeOrigin: true },
      "/upload": { target: "http://localhost:4319", changeOrigin: true },
      "/avatar": { target: "http://localhost:4319", changeOrigin: true },
      "/transcrever": { target: "http://localhost:4319", changeOrigin: true },
      "/arquivos": { target: "http://localhost:4319", changeOrigin: true },
    },
  },
});
