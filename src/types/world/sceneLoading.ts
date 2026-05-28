type SceneLoadingStatus = "loading" | "ready";

export interface SceneLoadingState {
  currentStep: string;
  progress: number;
  status: SceneLoadingStatus;
}

export type SceneLoadingChangeHandler = (state: SceneLoadingState) => void;

export const INITIAL_SCENE_LOADING_STATE: SceneLoadingState = {
  currentStep: "Initialisation du jeu",
  progress: 0,
  status: "loading",
};
