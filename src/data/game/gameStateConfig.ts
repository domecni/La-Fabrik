import type { GameStep, MainGameState } from "@/types/game";

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
];

export const MAIN_GAME_STATES: readonly MainGameState[] = [
  "intro",
  "ebike",
  "pylon",
  "farm",
  "outro",
] as const;

const GAME_STEP_VALUES: ReadonlySet<string> = new Set(GAME_STEPS);
const MAIN_GAME_STATE_VALUES: ReadonlySet<string> = new Set(MAIN_GAME_STATES);

export function isGameStep(value: unknown): value is GameStep {
  return typeof value === "string" && GAME_STEP_VALUES.has(value);
}

export function isMainGameState(value: unknown): value is MainGameState {
  return typeof value === "string" && MAIN_GAME_STATE_VALUES.has(value);
}
