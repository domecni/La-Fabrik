import type { AudioCategory } from "@/managers/AudioManager";

export const AUDIO_PATHS = {
  intro: "/sounds/effect/fa.mp3",
  bienvenue: "/sounds/effect/fa.mp3",
  alertCentral: "/sounds/effect/fa.mp3",
  searching: "/sounds/effect/fa.mp3",
  helped: "/sounds/effect/fa.mp3",
} as const;

export const DEFAULT_CATEGORY_VOLUMES: Record<AudioCategory, number> = {
  music: 1,
  sfx: 1,
  dialogue: 1,
};
