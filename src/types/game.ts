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

export const GAME_STEPS: readonly GameStep[] = [
  "intro",
  "start-intro",
  "naming",
  "bienvenue",
  "star-move",
  "mission2",
  "searching",
  "helped",
  "manipulation",
  "outOfFabrik",
] as const;

const GAME_STEP_VALUES: ReadonlySet<string> = new Set(GAME_STEPS);

export type MainGameState = "intro" | "bike" | "pylone" | "ferme" | "outro";

export const MAIN_GAME_STATES: readonly MainGameState[] = [
  "intro",
  "bike",
  "pylone",
  "ferme",
  "outro",
] as const;

const MAIN_GAME_STATE_VALUES: ReadonlySet<string> = new Set(MAIN_GAME_STATES);

export function isGameStep(value: unknown): value is GameStep {
  return typeof value === "string" && GAME_STEP_VALUES.has(value);
}

export function isMainGameState(value: unknown): value is MainGameState {
  return typeof value === "string" && MAIN_GAME_STATE_VALUES.has(value);
}

export interface Zone {
  id: string;
  position: Vector3Tuple;
  radius: number;
  height: number;
  targetStep: GameStep;
}
