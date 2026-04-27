import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import type { ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

const saveMapPlugin = () => ({
  name: "save-map-api",
  configureServer(server: ViteDevServer) {
    server.middlewares.use(
      "/api/save-map",
      async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          res.writeHead(405).end();
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => (body += chunk.toString()));
        req.on("end", () => {
          try {
            const mapPath = path.resolve(__dirname, "public/map.json");
            fs.writeFileSync(mapPath, body);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500).end(
              JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
              }),
            );
          }
        });
      },
    );
  },
});
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), saveMapPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
