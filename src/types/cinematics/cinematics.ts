import type { Vector3Tuple } from "@/types/three/three";

export interface CinematicCameraKeyframe {
  time: number;
  position: Vector3Tuple;
  target: Vector3Tuple;
}

export interface CinematicDialogueCue {
  time: number;
  dialogueId: string;
}

export interface CinematicDefinition {
  id: string;
  timecode?: number;
  cameraKeyframes: CinematicCameraKeyframe[];
  dialogueCues?: CinematicDialogueCue[];
}

export interface CinematicManifest {
  version: 1;
  cinematics: CinematicDefinition[];
}
