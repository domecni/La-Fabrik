import type { Vector3Tuple } from "@/types/three/three";

export type GameStep =
  | "intro"
  | "start-intro"
  | "naming"
  | "bienvenue"
  | "star-move"
  | "mission2"
  | "searching"
  | "helped"
  | "manipulation"
  | "outOfFabrik";

export type MainGameState = "intro" | "ebike" | "pylon" | "farm" | "outro";

export interface Zone {
  id: string;
  position: Vector3Tuple;
  radius: number;
  height: number;
  targetStep: GameStep;
}
