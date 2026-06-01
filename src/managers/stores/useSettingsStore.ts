import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AudioManager } from "@/managers/AudioManager";
import type { AudioCategory } from "@/managers/AudioManager";
import type { SubtitleLanguage } from "@/types/settings/settings";

interface SettingsState {
  isSettingsMenuOpen: boolean;
  musicVolume: number;
  sfxVolume: number;
  dialogueVolume: number;
  subtitlesEnabled: boolean;
  subtitleLanguage: SubtitleLanguage;
}

interface SettingsActions {
  setSettingsMenuOpen: (open: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setDialogueVolume: (volume: number) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  setSubtitleLanguage: (language: SubtitleLanguage) => void;
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
};

const SETTINGS_STORAGE_KEY = "la-fabrik-settings";

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

function applyAudioSettings(
  settings: Pick<SettingsState, "musicVolume" | "sfxVolume" | "dialogueVolume">,
): void {
  AudioManager.getInstance().setCategoryVolume("music", settings.musicVolume);
  AudioManager.getInstance().setCategoryVolume("sfx", settings.sfxVolume);
  AudioManager.getInstance().setCategoryVolume(
    "dialogue",
    settings.dialogueVolume,
  );
}

applyAudioSettings(DEFAULT_SETTINGS);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
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
      resetSettings: () => {
        applyAudioSettings(DEFAULT_SETTINGS);
        set(DEFAULT_SETTINGS);
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        dialogueVolume: state.dialogueVolume,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        subtitleLanguage: state.subtitleLanguage,
        subtitlesEnabled: state.subtitlesEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyAudioSettings(state);
      },
    },
  ),
);
