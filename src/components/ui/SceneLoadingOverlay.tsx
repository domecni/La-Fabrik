import type { SceneLoadingState } from "@/types/world/sceneLoading";

interface SceneLoadingOverlayProps {
  state: SceneLoadingState;
}

export function SceneLoadingOverlay({
  state,
}: SceneLoadingOverlayProps): React.JSX.Element | null {
  const isReady = state.status === "ready";
  const progress = Math.round(Math.max(0, Math.min(1, state.progress)) * 100);
  const helperText = getLoadingHelperText(state.progress);

  return (
    <div
      className={`scene-loading-overlay${isReady ? " scene-loading-overlay--ready" : ""}`}
      aria-live="polite"
    >
      <div className="scene-loading-overlay__content">
        <strong>{state.currentStep}</strong>
        <p>{helperText}</p>
        <div className="scene-loading-overlay__track">
          <span style={{ width: `${progress}%` }} />
          <em>{progress}%</em>
        </div>
      </div>
    </div>
  );
}

function getLoadingHelperText(progress: number): string {
  if (progress >= 0.95) {
    return "Finalisation de la scène et de la première frame.";
  }

  if (progress >= 0.7) {
    return "Préparation des collisions et du gameplay.";
  }

  if (progress >= 0.25) {
    return "Chargement progressif de la map autour du joueur.";
  }

  return "Récupération des données et modèles nécessaires.";
}
