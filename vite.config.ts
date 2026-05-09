import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { parseMapNodes } from "./src/utils/map/mapNodeValidation";
import { parseSrt } from "./src/utils/subtitles/parseSrt";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MAX_MAP_PAYLOAD_BYTES = 1024 * 1024;
const MAX_SRT_PAYLOAD_BYTES = 256 * 1024;
const JSON_HEADERS = { "Content-Type": "application/json" };
type JsonResponseBody = Readonly<Record<string, string | boolean>>;
const SRT_VOICES = new Set(["narrateur", "fermier", "electricienne"]);
const SRT_LANGUAGES = new Set(["fr", "en"]);

function sendJson(
  res: ServerResponse,
  status: number,
  body: JsonResponseBody,
  headers: Record<string, string> = {},
): void {
  res
    .writeHead(status, { ...JSON_HEADERS, ...headers })
    .end(JSON.stringify(body));
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
        try {
          parseMapNodes(data);
        } catch {
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

const saveSrtPlugin = (): Plugin => ({
  name: "save-srt-api",
  configureServer(server) {
    server.middlewares.use("/api/save-srt", async (req, res) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, { Allow: "POST" });
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_SRT_PAYLOAD_BYTES) {
          sendJson(res, 413, { error: "Payload too large" });
          req.destroy();
          return;
        }
        chunks.push(buffer);
      }

      try {
        const data = JSON.parse(Buffer.concat(chunks).toString()) as unknown;
        if (!isSrtPayload(data)) {
          sendJson(res, 400, { error: "Invalid SRT payload" });
          return;
        }

        if (!isValidSrtContent(data.content)) {
          sendJson(res, 400, { error: "Invalid SRT content" });
          return;
        }

        const subtitlesRoot = path.resolve(
          __dirname,
          "public/sounds/dialogue/subtitles",
        );
        const srtPath = path.resolve(
          subtitlesRoot,
          data.language,
          `${data.voice}.srt`,
        );

        if (!srtPath.startsWith(`${subtitlesRoot}${path.sep}`)) {
          sendJson(res, 400, { error: "Invalid SRT path" });
          return;
        }

        await fs.promises.mkdir(path.dirname(srtPath), { recursive: true });
        await fs.promises.writeFile(srtPath, data.content, "utf8");
        sendJson(res, 200, { success: true });
      } catch (err) {
        const status = err instanceof SyntaxError ? 400 : 500;
        const message = err instanceof Error ? err.message : "Unknown error";
        sendJson(res, status, { error: message });
      }
    });
  },
});

interface SrtPayload {
  voice: string;
  language: string;
  content: string;
}

function isSrtPayload(data: unknown): data is SrtPayload {
  if (!data || typeof data !== "object") return false;

  const payload = data as Partial<SrtPayload>;
  return (
    typeof payload.voice === "string" &&
    SRT_VOICES.has(payload.voice) &&
    typeof payload.language === "string" &&
    SRT_LANGUAGES.has(payload.language) &&
    typeof payload.content === "string"
  );
}

function isValidSrtContent(content: string): boolean {
  const blocks = content
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean);
  const cues = parseSrt(content);

  if (blocks.length === 0 || cues.length !== blocks.length) return false;

  const cueIndexes = new Set<number>();
  for (const cue of cues) {
    if (cueIndexes.has(cue.index)) return false;
    cueIndexes.add(cue.index);
  }

  return true;
}

export default defineConfig({
  plugins: [react(), saveMapPlugin(), saveSrtPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
