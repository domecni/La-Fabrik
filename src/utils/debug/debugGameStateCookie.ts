import type { GameState } from "@/managers/stores/useGameStore";

const DEBUG_GAME_STATE_COOKIE_NAME = "la-fabrik-debug-game-state";
const DEBUG_GAME_STATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : null;
}

export function readDebugGameStateCookie(): unknown {
  const value = getCookieValue(DEBUG_GAME_STATE_COOKIE_NAME);
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function writeDebugGameStateCookie(state: GameState): void {
  if (typeof document === "undefined") return;

  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${DEBUG_GAME_STATE_COOKIE_NAME}=${value}; max-age=${DEBUG_GAME_STATE_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function clearDebugGameStateCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${DEBUG_GAME_STATE_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}
