type SceneLoadingStatus = "loading" | "ready";

export interface SceneLoadingState {
  currentStep: string;
  progress: number;
  status: SceneLoadingStatus;
}

export type SceneLoadingChangeHandler = (state: SceneLoadingState) => void;
