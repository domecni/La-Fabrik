import type { SceneLoadingState } from "@/types/world/sceneLoading";

interface SceneLoadingOverlayProps {
  state: SceneLoadingState;
}

export function SceneLoadingOverlay({
  state,
}: SceneLoadingOverlayProps): React.JSX.Element | null {
  const isReady = state.status === "ready";
  const progress = Math.round(Math.max(0, Math.min(1, state.progress)) * 100);

  return (
    <div
      className={`scene-loading-overlay${isReady ? " scene-loading-overlay--ready" : ""}`}
      aria-live="polite"
    >
      <div className="scene-loading-overlay__content">
        <strong>{state.currentStep}</strong>
        <div className="scene-loading-overlay__track">
          <span style={{ width: `${progress}%` }} />
          <em>{progress}%</em>
        </div>
      </div>
    </div>
  );
}
