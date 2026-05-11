import { create } from "zustand";
import {
  isRepairMissionId,
  type MissionStep,
  type RepairMissionId,
} from "@/types/gameplay/repairMission";

export type MainGameState = "intro" | "bike" | "pylone" | "ferme" | "outro";
export type { MissionStep, RepairMissionId };

interface IntroState {
  dialogueAudio: string | null;
  hasCompleted: boolean;
  isBikeUnlocked: boolean;
}

interface MissionState {
  currentStep: MissionStep;
  dialogueAudio: string | null;
}

interface GameState {
  mainState: MainGameState;
  isCinematicPlaying: boolean;
  intro: IntroState;
  bike: MissionState & {
    isRepaired: boolean;
  };
  pylone: MissionState & {
    isPowered: boolean;
  };
  ferme: MissionState & {
    irrigationFixed: boolean;
  };
  outro: {
    dialogueAudio: string | null;
    hasStarted: boolean;
  };
}

interface GameActions {
  setMainState: (mainState: MainGameState) => void;
  setCinematicPlaying: (isCinematicPlaying: boolean) => void;
  setIntroState: (intro: Partial<IntroState>) => void;
  setBikeState: (bike: Partial<GameState["bike"]>) => void;
  setPyloneState: (pylone: Partial<GameState["pylone"]>) => void;
  setFermeState: (ferme: Partial<GameState["ferme"]>) => void;
  setOutroState: (outro: Partial<GameState["outro"]>) => void;
  setMissionStep: (mission: RepairMissionId, step: MissionStep) => void;
  completeIntro: () => void;
  completeBike: () => void;
  completePylone: () => void;
  completeFerme: () => void;
  completeMission: (mission: RepairMissionId) => void;
  startOutro: () => void;
  advanceGameState: () => void;
  rewindGameState: () => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;
type GameStateUpdate = Partial<GameState>;

function getNextMissionStep(step: MissionStep): MissionStep {
  switch (step) {
    case "locked":
      return "waiting";
    case "waiting":
      return "inspected";
    case "inspected":
      return "fragmented";
    case "fragmented":
      return "scanning";
    case "scanning":
      return "repairing";
    case "repairing":
      return "reassembling";
    case "reassembling":
    case "done":
      return "done";
  }
}

function getPreviousMissionStep(step: MissionStep): MissionStep {
  switch (step) {
    case "locked":
    case "waiting":
      return "locked";
    case "inspected":
      return "waiting";
    case "fragmented":
      return "inspected";
    case "scanning":
      return "fragmented";
    case "repairing":
      return "scanning";
    case "reassembling":
      return "repairing";
    case "done":
      return "reassembling";
  }
}

function completeIntroState(state: GameState): GameStateUpdate {
  return {
    mainState: "bike",
    intro: {
      ...state.intro,
      hasCompleted: true,
      isBikeUnlocked: true,
    },
    bike: {
      ...state.bike,
      currentStep: "waiting",
    },
  };
}

function completeBikeState(state: GameState): GameStateUpdate {
  return {
    mainState: "pylone",
    bike: {
      ...state.bike,
      currentStep: "done",
      isRepaired: true,
    },
    pylone: {
      ...state.pylone,
      currentStep: "waiting",
    },
  };
}

function completePyloneState(state: GameState): GameStateUpdate {
  return {
    mainState: "ferme",
    pylone: {
      ...state.pylone,
      currentStep: "done",
      isPowered: true,
    },
    ferme: {
      ...state.ferme,
      currentStep: "waiting",
    },
  };
}

function completeFermeState(state: GameState): GameStateUpdate {
  return {
    mainState: "outro",
    ferme: {
      ...state.ferme,
      currentStep: "done",
      irrigationFixed: true,
    },
    outro: {
      ...state.outro,
      hasStarted: true,
    },
  };
}

function setMissionStepState(
  state: GameState,
  mission: RepairMissionId,
  step: MissionStep,
): GameStateUpdate {
  return {
    [mission]: {
      ...state[mission],
      currentStep: step,
    },
  };
}

function completeMissionState(
  state: GameState,
  mission: RepairMissionId,
): GameStateUpdate {
  switch (mission) {
    case "bike":
      return completeBikeState(state);
    case "pylone":
      return completePyloneState(state);
    case "ferme":
      return completeFermeState(state);
  }
}

function advanceRepairMissionState(
  state: GameState,
  mission: RepairMissionId,
): GameStateUpdate {
  const nextStep = getNextMissionStep(state[mission].currentStep);
  if (nextStep === "done") {
    return completeMissionState(state, mission);
  }

  return setMissionStepState(state, mission, nextStep);
}

function rewindRepairMissionState(
  state: GameState,
  mission: RepairMissionId,
): GameStateUpdate {
  return setMissionStepState(
    state,
    mission,
    getPreviousMissionStep(state[mission].currentStep),
  );
}

function startOutroState(state: GameState): GameStateUpdate {
  return {
    mainState: "outro",
    outro: {
      ...state.outro,
      hasStarted: true,
    },
  };
}

function createInitialGameState(): GameState {
  return {
    mainState: "intro",
    isCinematicPlaying: false,
    intro: {
      dialogueAudio: null,
      hasCompleted: false,
      isBikeUnlocked: false,
    },
    bike: {
      currentStep: "locked",
      dialogueAudio: null,
      isRepaired: false,
    },
    pylone: {
      currentStep: "locked",
      dialogueAudio: null,
      isPowered: false,
    },
    ferme: {
      currentStep: "locked",
      dialogueAudio: null,
      irrigationFixed: false,
    },
    outro: {
      dialogueAudio: null,
      hasStarted: false,
    },
  };
}

export const useGameStore = create<GameStore>()((set) => ({
  ...createInitialGameState(),
  setMainState: (mainState) => set({ mainState }),
  setCinematicPlaying: (isCinematicPlaying) => set({ isCinematicPlaying }),
  setIntroState: (intro) =>
    set((state) => ({ intro: { ...state.intro, ...intro } })),
  setBikeState: (bike) =>
    set((state) => ({ bike: { ...state.bike, ...bike } })),
  setPyloneState: (pylone) =>
    set((state) => ({ pylone: { ...state.pylone, ...pylone } })),
  setFermeState: (ferme) =>
    set((state) => ({ ferme: { ...state.ferme, ...ferme } })),
  setOutroState: (outro) =>
    set((state) => ({ outro: { ...state.outro, ...outro } })),
  setMissionStep: (mission, step) =>
    set((state) => setMissionStepState(state, mission, step)),
  completeIntro: () => set(completeIntroState),
  completeBike: () => set((state) => completeMissionState(state, "bike")),
  completePylone: () => set((state) => completeMissionState(state, "pylone")),
  completeFerme: () => set((state) => completeMissionState(state, "ferme")),
  completeMission: (mission) =>
    set((state) => completeMissionState(state, mission)),
  startOutro: () => set(startOutroState),
  advanceGameState: () =>
    set((state) => {
      if (state.mainState === "intro") {
        return completeIntroState(state);
      }

      if (isRepairMissionId(state.mainState)) {
        return advanceRepairMissionState(state, state.mainState);
      }

      return startOutroState(state);
    }),
  rewindGameState: () =>
    set((state) => {
      if (state.mainState === "intro") {
        return { intro: { ...state.intro, hasCompleted: false } };
      }

      if (isRepairMissionId(state.mainState)) {
        return rewindRepairMissionState(state, state.mainState);
      }

      return { outro: { ...state.outro, hasStarted: false } };
    }),
  resetGame: () => set(createInitialGameState()),
}));
