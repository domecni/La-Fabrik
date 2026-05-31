import { create } from "zustand";
import { isGameStep, isMainGameState } from "@/data/game/gameStateConfig";
import {
  getNextMissionStep,
  getPreviousMissionStep,
  isMissionStep,
  isRepairMissionId,
} from "@/data/gameplay/repairMissionState";
import {
  PLAYER_EBIKE_SPEED,
  PLAYER_WALK_SPEED,
} from "@/data/player/playerConfig";
import type { GameStep, MainGameState } from "@/types/game";
import {
  type MissionStep,
  type RepairMissionId,
} from "@/types/gameplay/repairMission";
import {
  clearDebugGameStateCookie,
  readDebugGameStateCookie,
  writeDebugGameStateCookie,
} from "@/utils/debug/debugGameStateCookie";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

export type PlayerMovementMode = "walk" | "ebike";
export type { MissionStep, RepairMissionId };

interface IntroState {
  currentStep: GameStep;
  dialogueAudio: string | null;
  hasCompleted: boolean;
  isEbikeUnlocked: boolean;
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
  player: PlayerState;
  intro: IntroState;
  ebike: MissionState & {
    isRepaired: boolean;
  };
  pylon: MissionState & {
    isPowered: boolean;
  };
  farm: MissionState & {
    irrigationFixed: boolean;
  };
  outro: {
    dialogueAudio: string | null;
    hasStarted: boolean;
  };
}

interface PlayerState {
  movementMode: PlayerMovementMode;
  currentSpeed: number;
}

interface GameActions {
  setMainState: (mainState: MainGameState) => void;
  setCinematicPlaying: (isCinematicPlaying: boolean) => void;
  hideDialog: () => void;
  setActivityCity: (activityCity: boolean) => void;
  setCanMove: (canMove: boolean) => void;
  setPlayerMovementMode: (mode: PlayerMovementMode) => void;
  setIntroStep: (step: GameStep) => void;
  setIntroState: (intro: Partial<IntroState>) => void;
  setPlayerName: (playerName: string) => void;
  setEbikeState: (ebike: Partial<GameState["ebike"]>) => void;
  setPylonState: (pylon: Partial<GameState["pylon"]>) => void;
  setFarmState: (farm: Partial<GameState["farm"]>) => void;
  setOutroState: (outro: Partial<GameState["outro"]>) => void;
  setMissionStep: (mission: RepairMissionId, step: MissionStep) => void;
  completeIntro: () => void;
  completeEbike: () => void;
  completePylon: () => void;
  completeFarm: () => void;
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

function isPlayerMovementMode(value: unknown): value is PlayerMovementMode {
  return value === "walk" || value === "ebike";
}

function completeIntroState(state: GameState): GameStateUpdate {
  return {
    mainState: "ebike",
    intro: {
      ...state.intro,
      currentStep: "completed",
      hasCompleted: true,
      isEbikeUnlocked: true,
    },
    missionFlow: {
      ...state.missionFlow,
      canMove: true,
    },
    ebike: {
      ...state.ebike,
      currentStep: "locked",
    },
  };
}

function completeEbikeState(state: GameState): GameStateUpdate {
  return {
    mainState: "pylon",
    ebike: {
      ...state.ebike,
      currentStep: "done",
      isRepaired: true,
    },
    pylon: {
      ...state.pylon,
      currentStep: "waiting",
    },
  };
}

function completePylonState(state: GameState): GameStateUpdate {
  return {
    mainState: "farm",
    pylon: {
      ...state.pylon,
      currentStep: "done",
      isPowered: true,
    },
    farm: {
      ...state.farm,
      currentStep: "waiting",
    },
  };
}

function completeFarmState(state: GameState): GameStateUpdate {
  return {
    mainState: "outro",
    farm: {
      ...state.farm,
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
    case "ebike":
      return completeEbikeState(state);
    case "pylon":
      return completePylonState(state);
    case "farm":
      return completeFarmState(state);
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
    player: {
      movementMode: "walk",
      currentSpeed: PLAYER_WALK_SPEED,
    },
    intro: {
      currentStep: "loading-map",
      dialogueAudio: null,
      hasCompleted: false,
      isEbikeUnlocked: false,
    },
    ebike: {
      currentStep: "locked",
      dialogueAudio: null,
      isRepaired: false,
    },
    pylon: {
      currentStep: "locked",
      dialogueAudio: null,
      isPowered: false,
    },
    farm: {
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
    isEbikeUnlocked: isBoolean(value.isEbikeUnlocked)
      ? value.isEbikeUnlocked
      : initial.isEbikeUnlocked,
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

function hydratePlayerState(initial: PlayerState, value: unknown): PlayerState {
  if (!isRecord(value)) return initial;

  return {
    movementMode: isPlayerMovementMode(value.movementMode)
      ? value.movementMode
      : initial.movementMode,
    currentSpeed:
      typeof value.currentSpeed === "number"
        ? value.currentSpeed
        : initial.currentSpeed,
  };
}

function hydrateDebugGameState(initial: GameState, value: unknown): GameState {
  if (!isRecord(value)) return initial;

  const ebike = hydrateMissionState(initial.ebike, value.ebike);
  const pylon = hydrateMissionState(initial.pylon, value.pylon);
  const farm = hydrateMissionState(initial.farm, value.farm);
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
    player: hydratePlayerState(initial.player, value.player),
    intro: hydrateIntroState(initial.intro, value.intro),
    ebike: {
      ...ebike,
      isRepaired:
        isRecord(value.ebike) && isBoolean(value.ebike.isRepaired)
          ? value.ebike.isRepaired
          : initial.ebike.isRepaired,
    },
    pylon: {
      ...pylon,
      isPowered:
        isRecord(value.pylon) && isBoolean(value.pylon.isPowered)
          ? value.pylon.isPowered
          : initial.pylon.isPowered,
    },
    farm: {
      ...farm,
      irrigationFixed:
        isRecord(value.farm) && isBoolean(value.farm.irrigationFixed)
          ? value.farm.irrigationFixed
          : initial.farm.irrigationFixed,
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
    player: state.player,
    intro: state.intro,
    ebike: state.ebike,
    pylon: state.pylon,
    farm: state.farm,
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
  setPlayerMovementMode: (mode) =>
    set((state) => ({
      player: {
        ...state.player,
        movementMode: mode,
        currentSpeed: mode === "ebike" ? PLAYER_EBIKE_SPEED : PLAYER_WALK_SPEED,
      },
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
  setEbikeState: (ebike) =>
    set((state) => ({ ebike: { ...state.ebike, ...ebike } })),
  setPylonState: (pylon) =>
    set((state) => ({ pylon: { ...state.pylon, ...pylon } })),
  setFarmState: (farm) =>
    set((state) => ({ farm: { ...state.farm, ...farm } })),
  setOutroState: (outro) =>
    set((state) => ({ outro: { ...state.outro, ...outro } })),
  setMissionStep: (mission, step) =>
    set((state) => setMissionStepState(state, mission, step)),
  completeIntro: () => set(completeIntroState),
  completeEbike: () => set((state) => completeMissionState(state, "ebike")),
  completePylon: () => set((state) => completeMissionState(state, "pylon")),
  completeFarm: () => set((state) => completeMissionState(state, "farm")),
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
