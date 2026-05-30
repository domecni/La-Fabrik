import type { GameStep, MainGameState, SiteStep } from "@/types/game";

/**
 * Steps for the /site onboarding page
 */
export const SITE_STEPS: readonly SiteStep[] = [
  "welcome",
  "situation",
  "naming",
  "transition",
];

/**
 * Steps for the intro sequence (after /site, on / route)
 */
export const GAME_STEPS: readonly GameStep[] = [
  "loading-map",
  "fade-to-video",
  "video",
  "dialogue-intro",
  "reveal",
  "playing",
];

export const MAIN_GAME_STATES: readonly MainGameState[] = [
  "intro",
  "ebike",
  "pylon",
  "farm",
  "outro",
] as const;

const SITE_STEP_VALUES: ReadonlySet<string> = new Set(SITE_STEPS);
const GAME_STEP_VALUES: ReadonlySet<string> = new Set(GAME_STEPS);
const MAIN_GAME_STATE_VALUES: ReadonlySet<string> = new Set(MAIN_GAME_STATES);

export function isSiteStep(value: unknown): value is SiteStep {
  return typeof value === "string" && SITE_STEP_VALUES.has(value);
}

export function isGameStep(value: unknown): value is GameStep {
  return typeof value === "string" && GAME_STEP_VALUES.has(value);
}

export function isMainGameState(value: unknown): value is MainGameState {
  return typeof value === "string" && MAIN_GAME_STATE_VALUES.has(value);
}
