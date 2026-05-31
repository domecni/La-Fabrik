export type AudioCategory = "music" | "sfx" | "dialogue";

export const DEFAULT_CATEGORY_VOLUMES: Record<AudioCategory, number> = {
  music: 1,
  sfx: 1,
  dialogue: 1,
};
