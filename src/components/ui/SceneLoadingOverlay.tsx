import { AppLoadingIndicator } from "@/components/ui/AppLoadingIndicator";
import type { SceneLoadingState } from "@/types/world/sceneLoading";

const LOADING_BACKGROUND_PATH = "/assets/bg-site.png";
const LOADING_LOGO_PATH = "/assets/logo/logo.jpg";

for (const path of [LOADING_BACKGROUND_PATH, LOADING_LOGO_PATH]) {
  const image = new Image();
  image.src = path;
}

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
      <img
        alt=""
        className="scene-loading-overlay__background"
        src={LOADING_BACKGROUND_PATH}
      />
      <div className="scene-loading-overlay__shade" />
      <img
        alt="La Fabrik Durable"
        className="scene-loading-overlay__logo"
        src={LOADING_LOGO_PATH}
      />
      <div className="scene-loading-overlay__footer">
        <div className="scene-loading-overlay__meta">
          <AppLoadingIndicator className="scene-loading-overlay__label" />
          <strong>{progress}%</strong>
        </div>
        <div className="scene-loading-overlay__track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
