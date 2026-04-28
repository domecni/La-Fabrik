import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { ServerResponse } from "node:http";
import type { Plugin } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MAX_MAP_PAYLOAD_BYTES = 1024 * 1024;
const JSON_HEADERS = { "Content-Type": "application/json" };

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  res
    .writeHead(status, { ...JSON_HEADERS, ...headers })
    .end(JSON.stringify(body));
}

function isVector3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function isMapNode(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const node = value as Record<string, unknown>;

  return (
    typeof node.name === "string" &&
    typeof node.type === "string" &&
    isVector3(node.position) &&
    isVector3(node.rotation) &&
    isVector3(node.scale)
  );
}

function isMapPayload(value: unknown): boolean {
  return Array.isArray(value) && value.every(isMapNode);
}

const saveMapPlugin = (): Plugin => ({
  name: "save-map-api",
  configureServer(server) {
    server.middlewares.use("/api/save-map", async (req, res) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, { Allow: "POST" });
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_MAP_PAYLOAD_BYTES) {
          sendJson(res, 413, { error: "Payload too large" });
          req.destroy();
          return;
        }
        chunks.push(buffer);
      }

      try {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        if (!isMapPayload(data)) {
          sendJson(res, 400, { error: "Invalid map payload" });
          return;
        }

        const mapPath = path.resolve(__dirname, "public/map.json");
        await fs.promises.writeFile(
          mapPath,
          JSON.stringify(data, null, 2),
          "utf8",
        );
        sendJson(res, 200, { success: true });
      } catch (err) {
        const status = err instanceof SyntaxError ? 400 : 500;
        const message = err instanceof Error ? err.message : "Unknown error";
        sendJson(res, status, { error: message });
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), saveMapPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
