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
const MAX_DIALOGUE_MANIFEST_PAYLOAD_BYTES = 256 * 1024;
const MAX_CINEMATIC_MANIFEST_PAYLOAD_BYTES = 256 * 1024;
const JSON_HEADERS = { "Content-Type": "application/json" };
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
type JsonObject = { readonly [key: string]: JsonValue };
type JsonResponseBody = Readonly<Record<string, JsonValue>>;
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

const validateDialoguesPlugin = (): Plugin => ({
  name: "validate-dialogues-api",
  configureServer(server) {
    server.middlewares.use("/api/validate-dialogues", async (req, res) => {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, { Allow: "GET" });
        return;
      }

      try {
        const result = await validateDialogueAssets();
        sendJson(res, result.valid ? 200 : 400, result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendJson(res, 500, { error: message });
      }
    });
  },
});

const saveDialogueManifestPlugin = (): Plugin => ({
  name: "save-dialogue-manifest-api",
  configureServer(server) {
    server.middlewares.use("/api/save-dialogues", async (req, res) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, { Allow: "POST" });
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_DIALOGUE_MANIFEST_PAYLOAD_BYTES) {
          sendJson(res, 413, { error: "Payload too large" });
          req.destroy();
          return;
        }
        chunks.push(buffer);
      }

      try {
        const data = JSON.parse(Buffer.concat(chunks).toString()) as unknown;
        parseDialogueManifestData(data);

        const manifestPath = path.resolve(
          __dirname,
          "public/sounds/dialogue/dialogues.json",
        );
        await fs.promises.writeFile(
          manifestPath,
          `${JSON.stringify(data, null, 2)}\n`,
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

const saveCinematicManifestPlugin = (): Plugin => ({
  name: "save-cinematic-manifest-api",
  configureServer(server) {
    server.middlewares.use("/api/save-cinematics", async (req, res) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, { Allow: "POST" });
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_CINEMATIC_MANIFEST_PAYLOAD_BYTES) {
          sendJson(res, 413, { error: "Payload too large" });
          req.destroy();
          return;
        }
        chunks.push(buffer);
      }

      try {
        const data = JSON.parse(Buffer.concat(chunks).toString()) as unknown;
        parseCinematicManifestData(data);

        const manifestPath = path.resolve(__dirname, "public/cinematics.json");
        await fs.promises.writeFile(
          manifestPath,
          `${JSON.stringify(data, null, 2)}\n`,
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

interface SrtPayload {
  voice: string;
  language: string;
  content: string;
}

interface DialogueManifestData {
  voices: DialogueVoiceData[];
  dialogues: DialogueData[];
}

interface DialogueVoiceData {
  id: string;
  speaker: string;
  subtitles: Partial<Record<"fr" | "en", string>>;
}

interface DialogueData {
  id: string;
  voice: string;
  audio: string;
  subtitleCueIndex: number;
  timecode?: number;
}

interface CinematicManifestData {
  cinematics: CinematicData[];
}

interface CinematicData {
  id: string;
  timecode?: number;
  dialogueCues?: CinematicDialogueCueData[];
  cameraKeyframes: CinematicKeyframeData[];
}

interface CinematicDialogueCueData {
  time: number;
  dialogueId: string;
}

interface CinematicKeyframeData {
  time: number;
  position: [number, number, number];
  target: [number, number, number];
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

interface DialogueValidationResult extends JsonObject {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function validateDialogueAssets(): Promise<DialogueValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const manifestPath = path.resolve(
    __dirname,
    "public/sounds/dialogue/dialogues.json",
  );
  const manifestContent = await fs.promises.readFile(manifestPath, "utf8");
  const manifest = parseDialogueManifestData(JSON.parse(manifestContent));

  const subtitleCueCache = new Map<string, Set<number>>();

  for (const voice of manifest.voices) {
    const frSubtitlePath = voice.subtitles.fr;
    if (!frSubtitlePath) {
      errors.push(`Voice ${voice.id} must define a French subtitle file`);
    } else {
      await validateSubtitleFile(frSubtitlePath, errors, subtitleCueCache);
    }

    const enSubtitlePath = voice.subtitles.en;
    if (enSubtitlePath) {
      const resolvedEnPath = resolvePublicPath(enSubtitlePath);
      if (!resolvedEnPath || !fs.existsSync(resolvedEnPath)) {
        warnings.push(
          `English subtitle file missing for voice ${voice.id}; runtime will fall back to French`,
        );
      }
    }
  }

  for (const dialogue of manifest.dialogues) {
    const audioPath = resolvePublicPath(dialogue.audio);
    if (!audioPath || !fs.existsSync(audioPath)) {
      errors.push(`Dialogue ${dialogue.id} audio file is missing`);
    }

    const voice = manifest.voices.find(
      (item: DialogueVoiceData) => item.id === dialogue.voice,
    );
    const frSubtitlePath = voice?.subtitles.fr;
    const cueIndexes = frSubtitlePath
      ? subtitleCueCache.get(frSubtitlePath)
      : undefined;

    if (!cueIndexes?.has(dialogue.subtitleCueIndex)) {
      errors.push(
        `Dialogue ${dialogue.id} references missing cue ${dialogue.subtitleCueIndex}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function parseDialogueManifestData(data: unknown): DialogueManifestData {
  if (!isRecord(data) || data.version !== 1) {
    throw new Error("Invalid dialogue manifest");
  }

  if (!Array.isArray(data.voices) || !Array.isArray(data.dialogues)) {
    throw new Error("Dialogue manifest requires voices and dialogues arrays");
  }

  const voices = data.voices.map(parseDialogueVoiceData);
  const voiceIds = new Set(voices.map((voice) => voice.id));
  const dialogues = data.dialogues.map((dialogue) =>
    parseDialogueData(dialogue, voiceIds),
  );

  return { voices, dialogues };
}

function parseDialogueVoiceData(data: unknown): DialogueVoiceData {
  if (!isRecord(data) || typeof data.id !== "string") {
    throw new Error("Invalid dialogue voice");
  }

  if (typeof data.speaker !== "string") {
    throw new Error(`Dialogue voice ${data.id} must define a speaker`);
  }

  if (!isRecord(data.subtitles)) {
    throw new Error(`Dialogue voice ${data.id} must define subtitles`);
  }

  const subtitles: DialogueVoiceData["subtitles"] = {};
  if (typeof data.subtitles.fr === "string") subtitles.fr = data.subtitles.fr;
  if (typeof data.subtitles.en === "string") subtitles.en = data.subtitles.en;

  return {
    id: data.id,
    speaker: data.speaker,
    subtitles,
  };
}

function parseDialogueData(data: unknown, voiceIds: Set<string>): DialogueData {
  if (!isRecord(data)) {
    throw new Error("Invalid dialogue definition");
  }

  if (
    typeof data.id !== "string" ||
    typeof data.voice !== "string" ||
    !voiceIds.has(data.voice) ||
    typeof data.audio !== "string" ||
    typeof data.subtitleCueIndex !== "number" ||
    !Number.isInteger(data.subtitleCueIndex)
  ) {
    throw new Error("Invalid dialogue definition");
  }

  const dialogue: DialogueData = {
    id: data.id,
    voice: data.voice,
    audio: data.audio,
    subtitleCueIndex: data.subtitleCueIndex,
  };

  if (data.timecode !== undefined) {
    if (typeof data.timecode !== "number") {
      throw new Error("Invalid dialogue definition");
    }
    dialogue.timecode = data.timecode;
  }

  return dialogue;
}

function parseCinematicManifestData(data: unknown): CinematicManifestData {
  if (!isRecord(data) || data.version !== 1) {
    throw new Error("Invalid cinematic manifest");
  }

  if (!Array.isArray(data.cinematics)) {
    throw new Error("Cinematic manifest requires a cinematics array");
  }

  return {
    cinematics: data.cinematics.map(parseCinematicData),
  };
}

function parseCinematicData(data: unknown): CinematicData {
  if (!isRecord(data) || typeof data.id !== "string") {
    throw new Error("Invalid cinematic definition");
  }

  if (!Array.isArray(data.cameraKeyframes)) {
    throw new Error(`Cinematic ${data.id} requires cameraKeyframes`);
  }

  const cameraKeyframes = data.cameraKeyframes.map(parseCinematicKeyframeData);
  if (cameraKeyframes.length < 2) {
    throw new Error(`Cinematic ${data.id} requires at least two keyframes`);
  }

  cameraKeyframes.forEach((keyframe, index) => {
    const previousKeyframe = cameraKeyframes[index - 1];
    if (previousKeyframe && keyframe.time <= previousKeyframe.time) {
      throw new Error(`Cinematic ${data.id} keyframe times must increase`);
    }
  });

  const cinematic: CinematicData = {
    id: data.id,
    cameraKeyframes,
  };

  if (data.timecode !== undefined) {
    if (typeof data.timecode !== "number") {
      throw new Error(`Cinematic ${data.id} has an invalid timecode`);
    }
    cinematic.timecode = data.timecode;
  }

  if (data.dialogueCues !== undefined) {
    if (!Array.isArray(data.dialogueCues)) {
      throw new Error(`Cinematic ${data.id} has invalid dialogue cues`);
    }
    cinematic.dialogueCues = data.dialogueCues.map(
      parseCinematicDialogueCueData,
    );
  }

  return cinematic;
}

function parseCinematicDialogueCueData(
  data: unknown,
): CinematicDialogueCueData {
  if (
    !isRecord(data) ||
    typeof data.time !== "number" ||
    typeof data.dialogueId !== "string"
  ) {
    throw new Error("Invalid cinematic dialogue cue");
  }

  return {
    time: data.time,
    dialogueId: data.dialogueId,
  };
}

function parseCinematicKeyframeData(data: unknown): CinematicKeyframeData {
  if (!isRecord(data) || typeof data.time !== "number") {
    throw new Error("Invalid cinematic camera keyframe");
  }

  return {
    time: data.time,
    position: parseCinematicVector(data.position),
    target: parseCinematicVector(data.target),
  };
}

function parseCinematicVector(value: unknown): [number, number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((item) => typeof item !== "number")
  ) {
    throw new Error("Invalid cinematic vector");
  }

  return [value[0], value[1], value[2]];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function validateSubtitleFile(
  publicPath: string,
  errors: string[],
  subtitleCueCache: Map<string, Set<number>>,
): Promise<void> {
  const subtitlePath = resolvePublicPath(publicPath);
  if (!subtitlePath || !fs.existsSync(subtitlePath)) {
    errors.push(`Subtitle file ${publicPath} is missing`);
    return;
  }

  const content = await fs.promises.readFile(subtitlePath, "utf8");
  if (!isValidSrtContent(content)) {
    errors.push(`Subtitle file ${publicPath} is invalid`);
    return;
  }

  subtitleCueCache.set(
    publicPath,
    new Set(parseSrt(content).map((cue) => cue.index)),
  );
}

function resolvePublicPath(publicPath: string): string | null {
  if (!publicPath.startsWith("/")) return null;

  const publicRoot = path.resolve(__dirname, "public");
  const resolvedPath = path.resolve(publicRoot, publicPath.slice(1));

  if (!resolvedPath.startsWith(`${publicRoot}${path.sep}`)) return null;

  return resolvedPath;
}

export default defineConfig({
  plugins: [
    react(),
    saveMapPlugin(),
    saveSrtPlugin(),
    saveDialogueManifestPlugin(),
    saveCinematicManifestPlugin(),
    validateDialoguesPlugin(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
