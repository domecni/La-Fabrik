import type { SceneLoadingState } from "@/types/world/sceneLoading";

export const INITIAL_SCENE_LOADING_STATE: SceneLoadingState = {
  currentStep: "Initialisation du jeu",
  progress: 0,
  status: "loading",
};
