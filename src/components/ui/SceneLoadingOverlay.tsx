import type { SceneLoadingState } from "@/types/world/sceneLoading";

const LOADING_BACKGROUND_PATH = "/assets/bg-site.png";
const LOADING_LOGO_PATH = "/assets/logo.png";

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
          <div className="scene-loading-overlay__label">
            <span>Loading...</span>
            <svg
              className="scene-loading-overlay__spinner"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path
                d="M16 3a13 13 0 1 1-9.2 3.8"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
              <path
                d="M6.8 6.8V2.8H2.8"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
              />
            </svg>
          </div>
          <strong>{progress}%</strong>
        </div>
        <div className="scene-loading-overlay__track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
