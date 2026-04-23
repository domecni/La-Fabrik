import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import type { ViteDevServer } from "vite";

const saveMapPlugin = () => ({
  name: "save-map-api",
  configureServer(server: ViteDevServer) {
    server.middlewares.use("/api/save-map", async (req: any, res: any) => {
      if (req.method !== "POST") {
        res.writeHead(405).end();
        return;
      }
      
      let body = "";
      req.on("data", (chunk: any) => (body += chunk));
      req.on("end", () => {
        try {
          const mapPath = path.resolve(__dirname, "public/map.json");
          fs.writeFileSync(mapPath, body);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (err: any) {
          res.writeHead(500).end(JSON.stringify({ error: err.message }));
        }
      });
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveMapPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
