import { GAME_STEPS } from "@/data/game/gameStateConfig";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";

const TALKIE_FIRST_VISIBLE_STEP = "reveal";
const TALKIE_FIRST_VISIBLE_STEP_INDEX = GAME_STEPS.indexOf(
  TALKIE_FIRST_VISIBLE_STEP,
);

interface TalkieDialogueOverlayState {
  isNarratorDialogue: boolean;
  isVisible: boolean;
}

export function useTalkieDialogueOverlayState(): TalkieDialogueOverlayState {
  const activeSubtitle = useSubtitleStore((state) => state.activeSubtitle);
  const mainState = useGameStore((state) => state.mainState);
  const introStep = useGameStore((state) => state.intro.currentStep);
  const introStepIndex = GAME_STEPS.indexOf(introStep);

  return {
    isNarratorDialogue: activeSubtitle?.speaker === "Narrateur",
    isVisible:
      mainState !== "intro" ||
      introStepIndex >= TALKIE_FIRST_VISIBLE_STEP_INDEX,
  };
}
