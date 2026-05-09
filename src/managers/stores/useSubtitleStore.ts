import { create } from "zustand";
import type { DialogueSpeaker } from "@/types/dialogues/dialogues";

interface ActiveSubtitle {
  speaker: DialogueSpeaker;
  text: string;
}

interface SubtitleState {
  activeSubtitle: ActiveSubtitle | null;
}

interface SubtitleActions {
  setActiveSubtitle: (subtitle: ActiveSubtitle | null) => void;
  clearActiveSubtitle: () => void;
}

type SubtitleStore = SubtitleState & SubtitleActions;

export const useSubtitleStore = create<SubtitleStore>()((set) => ({
  activeSubtitle: null,
  setActiveSubtitle: (activeSubtitle) => set({ activeSubtitle }),
  clearActiveSubtitle: () => set({ activeSubtitle: null }),
}));
