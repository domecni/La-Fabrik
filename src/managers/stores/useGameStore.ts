import { create } from "zustand";

export type MainGameState = "intro" | "bike" | "pylone" | "ferme" | "outro";
type MissionStep =
  | "locked"
  | "waiting"
  | "inspected"
  | "fragmented"
  | "scanning"
  | "repairing"
  | "done";

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
  setIntroState: (intro: Partial<IntroState>) => void;
  setBikeState: (bike: Partial<GameState["bike"]>) => void;
  setPyloneState: (pylone: Partial<GameState["pylone"]>) => void;
  setFermeState: (ferme: Partial<GameState["ferme"]>) => void;
  setOutroState: (outro: Partial<GameState["outro"]>) => void;
  completeIntro: () => void;
  completeBike: () => void;
  completePylone: () => void;
  completeFerme: () => void;
  startOutro: () => void;
  advanceGameState: () => void;
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
    case "done":
      return "done";
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
    intro: {
      dialogueAudio: null,
      hasCompleted: false,
      isBikeUnlocked: false,
    },
    bike: {
      currentStep: "waiting",
      dialogueAudio: null,
      isRepaired: false,
    },
    pylone: {
      currentStep: "waiting",
      dialogueAudio: null,
      isPowered: false,
    },
    ferme: {
      currentStep: "waiting",
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
  completeIntro: () => set(completeIntroState),
  completeBike: () => set(completeBikeState),
  completePylone: () => set(completePyloneState),
  completeFerme: () => set(completeFermeState),
  startOutro: () => set(startOutroState),
  advanceGameState: () =>
    set((state) => {
      if (state.mainState === "intro") {
        return completeIntroState(state);
      }

      if (state.mainState === "bike") {
        const nextStep = getNextMissionStep(state.bike.currentStep);
        if (nextStep === "done") {
          return completeBikeState(state);
        }

        return { bike: { ...state.bike, currentStep: nextStep } };
      }

      if (state.mainState === "pylone") {
        const nextStep = getNextMissionStep(state.pylone.currentStep);
        if (nextStep === "done") {
          return completePyloneState(state);
        }

        return { pylone: { ...state.pylone, currentStep: nextStep } };
      }

      if (state.mainState === "ferme") {
        const nextStep = getNextMissionStep(state.ferme.currentStep);
        if (nextStep === "done") {
          return completeFermeState(state);
        }

        return { ferme: { ...state.ferme, currentStep: nextStep } };
      }

      return startOutroState(state);
    }),
  resetGame: () => set(createInitialGameState()),
}));
