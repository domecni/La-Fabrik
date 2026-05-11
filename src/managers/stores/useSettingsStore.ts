import { create } from "zustand";
import { AudioManager } from "@/managers/AudioManager";
import type { AudioCategory } from "@/managers/AudioManager";

export type SubtitleLanguage = "fr" | "en";
export type RepairRuntime = "js" | "python";

interface SettingsState {
  isSettingsMenuOpen: boolean;
  musicVolume: number;
  sfxVolume: number;
  dialogueVolume: number;
  subtitlesEnabled: boolean;
  subtitleLanguage: SubtitleLanguage;
  repairRuntime: RepairRuntime;
}

interface SettingsActions {
  setSettingsMenuOpen: (open: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setDialogueVolume: (volume: number) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  setSubtitleLanguage: (language: SubtitleLanguage) => void;
  setRepairRuntime: (runtime: RepairRuntime) => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const DEFAULT_SETTINGS: SettingsState = {
  isSettingsMenuOpen: false,
  musicVolume: 1,
  sfxVolume: 1,
  dialogueVolume: 1,
  subtitlesEnabled: true,
  subtitleLanguage: "fr",
  repairRuntime: "js",
};

function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

function setAudioCategoryVolume(
  category: AudioCategory,
  volume: number,
): number {
  const nextVolume = clampVolume(volume);
  AudioManager.getInstance().setCategoryVolume(category, nextVolume);
  return nextVolume;
}

function applyDefaultAudioSettings(): void {
  AudioManager.getInstance().setCategoryVolume(
    "music",
    DEFAULT_SETTINGS.musicVolume,
  );
  AudioManager.getInstance().setCategoryVolume(
    "sfx",
    DEFAULT_SETTINGS.sfxVolume,
  );
  AudioManager.getInstance().setCategoryVolume(
    "dialogue",
    DEFAULT_SETTINGS.dialogueVolume,
  );
}

applyDefaultAudioSettings();

export const useSettingsStore = create<SettingsStore>()((set) => ({
  ...DEFAULT_SETTINGS,
  setSettingsMenuOpen: (isSettingsMenuOpen) => set({ isSettingsMenuOpen }),
  setMusicVolume: (volume) =>
    set({ musicVolume: setAudioCategoryVolume("music", volume) }),
  setSfxVolume: (volume) =>
    set({ sfxVolume: setAudioCategoryVolume("sfx", volume) }),
  setDialogueVolume: (volume) =>
    set({ dialogueVolume: setAudioCategoryVolume("dialogue", volume) }),
  setSubtitlesEnabled: (subtitlesEnabled) => set({ subtitlesEnabled }),
  setSubtitleLanguage: (subtitleLanguage) => set({ subtitleLanguage }),
  setRepairRuntime: (repairRuntime) => set({ repairRuntime }),
  resetSettings: () => {
    applyDefaultAudioSettings();
    set(DEFAULT_SETTINGS);
  },
}));
