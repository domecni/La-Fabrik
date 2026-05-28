import { create } from "zustand";
import {
  isGameStep,
  isMainGameState,
  type GameStep,
  type MainGameState,
} from "@/types/game";
import {
  isRepairMissionId,
  isMissionStep,
  getNextMissionStep,
  getPreviousMissionStep,
  type MissionStep,
  type RepairMissionId,
} from "@/types/gameplay/repairMission";
import {
  clearDebugGameStateCookie,
  readDebugGameStateCookie,
  writeDebugGameStateCookie,
} from "@/utils/debug/debugGameStateCookie";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

export type { MissionStep, RepairMissionId };

interface IntroState {
  currentStep: GameStep;
  dialogueAudio: string | null;
  hasCompleted: boolean;
  isBikeUnlocked: boolean;
}

interface MissionState {
  currentStep: MissionStep;
  dialogueAudio: string | null;
}

interface MissionFlowState {
  activityCity: boolean;
  canMove: boolean;
  dialogMessage: string | null;
  playerName: string;
}

export interface GameState {
  mainState: MainGameState;
  isCinematicPlaying: boolean;
  missionFlow: MissionFlowState;
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
  hideDialog: () => void;
  setActivityCity: (activityCity: boolean) => void;
  setCanMove: (canMove: boolean) => void;
  setIntroStep: (step: GameStep) => void;
  setIntroState: (intro: Partial<IntroState>) => void;
  setPlayerName: (playerName: string) => void;
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
  showDialog: (dialogMessage: string) => void;
}

type GameStore = GameState & GameActions;
type GameStateUpdate = Partial<GameState>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
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
      currentStep: "locked",
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
    missionFlow: {
      activityCity: true,
      canMove: false,
      dialogMessage: null,
      playerName: "",
    },
    intro: {
      currentStep: "intro",
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

function hydrateIntroState(initial: IntroState, value: unknown): IntroState {
  if (!isRecord(value)) return initial;

  return {
    currentStep: isGameStep(value.currentStep)
      ? value.currentStep
      : initial.currentStep,
    dialogueAudio: isStringOrNull(value.dialogueAudio)
      ? value.dialogueAudio
      : initial.dialogueAudio,
    hasCompleted: isBoolean(value.hasCompleted)
      ? value.hasCompleted
      : initial.hasCompleted,
    isBikeUnlocked: isBoolean(value.isBikeUnlocked)
      ? value.isBikeUnlocked
      : initial.isBikeUnlocked,
  };
}

function hydrateMissionState(
  initial: MissionState,
  value: unknown,
): MissionState {
  if (!isRecord(value)) return initial;

  return {
    currentStep:
      typeof value.currentStep === "string" && isMissionStep(value.currentStep)
        ? value.currentStep
        : initial.currentStep,
    dialogueAudio: isStringOrNull(value.dialogueAudio)
      ? value.dialogueAudio
      : initial.dialogueAudio,
  };
}

function hydrateMissionFlowState(
  initial: MissionFlowState,
  value: unknown,
): MissionFlowState {
  if (!isRecord(value)) return initial;

  return {
    activityCity: isBoolean(value.activityCity)
      ? value.activityCity
      : initial.activityCity,
    canMove: isBoolean(value.canMove) ? value.canMove : initial.canMove,
    dialogMessage: isStringOrNull(value.dialogMessage)
      ? value.dialogMessage
      : initial.dialogMessage,
    playerName:
      typeof value.playerName === "string"
        ? value.playerName
        : initial.playerName,
  };
}

function hydrateDebugGameState(initial: GameState, value: unknown): GameState {
  if (!isRecord(value)) return initial;

  const bike = hydrateMissionState(initial.bike, value.bike);
  const pylone = hydrateMissionState(initial.pylone, value.pylone);
  const ferme = hydrateMissionState(initial.ferme, value.ferme);
  const outro = isRecord(value.outro) ? value.outro : null;

  return {
    mainState: isMainGameState(value.mainState)
      ? value.mainState
      : initial.mainState,
    isCinematicPlaying: isBoolean(value.isCinematicPlaying)
      ? value.isCinematicPlaying
      : initial.isCinematicPlaying,
    missionFlow: hydrateMissionFlowState(
      initial.missionFlow,
      value.missionFlow,
    ),
    intro: hydrateIntroState(initial.intro, value.intro),
    bike: {
      ...bike,
      isRepaired:
        isRecord(value.bike) && isBoolean(value.bike.isRepaired)
          ? value.bike.isRepaired
          : initial.bike.isRepaired,
    },
    pylone: {
      ...pylone,
      isPowered:
        isRecord(value.pylone) && isBoolean(value.pylone.isPowered)
          ? value.pylone.isPowered
          : initial.pylone.isPowered,
    },
    ferme: {
      ...ferme,
      irrigationFixed:
        isRecord(value.ferme) && isBoolean(value.ferme.irrigationFixed)
          ? value.ferme.irrigationFixed
          : initial.ferme.irrigationFixed,
    },
    outro: {
      dialogueAudio:
        outro && isStringOrNull(outro.dialogueAudio)
          ? outro.dialogueAudio
          : initial.outro.dialogueAudio,
      hasStarted:
        outro && isBoolean(outro.hasStarted)
          ? outro.hasStarted
          : initial.outro.hasStarted,
    },
  };
}

function createInitialDebugGameState(): GameState {
  const initialState = createInitialGameState();
  if (!isDebugEnabled()) return initialState;

  return hydrateDebugGameState(initialState, readDebugGameStateCookie());
}

function pickGameState(state: GameStore): GameState {
  return {
    mainState: state.mainState,
    isCinematicPlaying: state.isCinematicPlaying,
    missionFlow: state.missionFlow,
    intro: state.intro,
    bike: state.bike,
    pylone: state.pylone,
    ferme: state.ferme,
    outro: state.outro,
  };
}

export const useGameStore = create<GameStore>()((set) => ({
  ...createInitialDebugGameState(),
  setMainState: (mainState) => set({ mainState }),
  setCinematicPlaying: (isCinematicPlaying) => set({ isCinematicPlaying }),
  hideDialog: () =>
    set((state) => ({
      missionFlow: { ...state.missionFlow, dialogMessage: null },
    })),
  setActivityCity: (activityCity) =>
    set((state) => ({
      missionFlow: { ...state.missionFlow, activityCity },
    })),
  setCanMove: (canMove) =>
    set((state) => ({
      missionFlow: { ...state.missionFlow, canMove },
    })),
  setIntroStep: (step: GameStep) =>
    set((state) => ({ intro: { ...state.intro, currentStep: step } })),
  setIntroState: (intro) =>
    set((state) => ({ intro: { ...state.intro, ...intro } })),
  setPlayerName: (playerName) =>
    set((state) => ({
      missionFlow: { ...state.missionFlow, playerName },
    })),
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
  resetGame: () => {
    set(createInitialGameState());
    clearDebugGameStateCookie();
  },
  showDialog: (dialogMessage) =>
    set((state) => ({
      missionFlow: { ...state.missionFlow, dialogMessage },
    })),
}));

if (isDebugEnabled()) {
  useGameStore.subscribe((state) => {
    writeDebugGameStateCookie(pickGameState(state));
  });
}
