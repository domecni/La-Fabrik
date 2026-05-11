import type {
  CinematicCameraKeyframe,
  CinematicDefinition,
  CinematicDialogueCue,
  CinematicManifest,
} from "@/types/cinematics/cinematics";
import type { Vector3Tuple } from "@/types/three/three";

export function parseCinematicManifest(data: unknown): CinematicManifest {
  if (!isRecord(data) || data.version !== 1) {
    throw new Error("Invalid cinematic manifest version");
  }

  if (!Array.isArray(data.cinematics)) {
    throw new Error("Cinematic manifest requires a cinematics array");
  }

  return {
    version: 1,
    cinematics: data.cinematics.map(parseCinematicDefinition),
  };
}

function parseCinematicDefinition(data: unknown): CinematicDefinition {
  if (!isRecord(data) || typeof data.id !== "string") {
    throw new Error("Invalid cinematic definition");
  }

  if (!Array.isArray(data.cameraKeyframes)) {
    throw new Error(`Cinematic ${data.id} requires cameraKeyframes`);
  }

  const cameraKeyframes = data.cameraKeyframes.map(parseCameraKeyframe);
  if (cameraKeyframes.length < 2) {
    throw new Error(`Cinematic ${data.id} requires at least two keyframes`);
  }

  cameraKeyframes.forEach((keyframe, index) => {
    const previousKeyframe = cameraKeyframes[index - 1];
    if (previousKeyframe && keyframe.time <= previousKeyframe.time) {
      throw new Error(`Cinematic ${data.id} keyframe times must increase`);
    }
  });

  const cinematic: CinematicDefinition = {
    id: data.id,
    cameraKeyframes,
  };

  if (typeof data.timecode === "number") {
    cinematic.timecode = data.timecode;
  }

  if (Array.isArray(data.dialogueCues)) {
    cinematic.dialogueCues = data.dialogueCues.map(parseDialogueCue);
  }

  return cinematic;
}

function parseDialogueCue(data: unknown): CinematicDialogueCue {
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

function parseCameraKeyframe(data: unknown): CinematicCameraKeyframe {
  if (!isRecord(data) || typeof data.time !== "number") {
    throw new Error("Invalid cinematic camera keyframe");
  }

  return {
    time: data.time,
    position: parseVector3(data.position),
    target: parseVector3(data.target),
  };
}

function parseVector3(value: unknown): Vector3Tuple {
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
