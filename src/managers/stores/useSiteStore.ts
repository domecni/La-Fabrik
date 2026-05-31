import { create } from "zustand";
import type { SiteStep } from "@/types/game";

interface SiteState {
  currentStep: SiteStep;
  selectedExperienceIndex: number | null;
  selectedSituationIndex: number | null;
}

interface SiteActions {
  setStep: (step: SiteStep) => void;
  setSelectedExperienceIndex: (index: number) => void;
  setSelectedSituationIndex: (index: number) => void;
  reset: () => void;
}

type SiteStore = SiteState & SiteActions;

const initialState: SiteState = {
  currentStep: "disclaimer",
  selectedExperienceIndex: null,
  selectedSituationIndex: null,
};

export const useSiteStore = create<SiteStore>()((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setSelectedExperienceIndex: (index) =>
    set({ selectedExperienceIndex: index }),
  setSelectedSituationIndex: (index) => set({ selectedSituationIndex: index }),
  reset: () => set(initialState),
}));
