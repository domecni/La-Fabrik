import type { Vector3Tuple } from "@/types/three/three";

export interface StageAnchorConfig {
  color: string;
  position: Vector3Tuple;
  scale?: number;
}

export const INTRO_STAGE_ANCHOR: StageAnchorConfig = {
  color: "#7dd3fc",
  position: [0, 4, 0],
};

export const OUTRO_STAGE_ANCHOR: StageAnchorConfig = {
  color: "#fb7185",
  position: [0, 6, 10],
  scale: 1.25,
};
