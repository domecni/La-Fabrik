import { useEffect, useState } from "react";
import { AppLoadingIndicator } from "@/components/ui/AppLoadingIndicator";
import type { SceneLoadingState } from "@/types/world/sceneLoading";
import { assetUrl } from "@/utils/assetUrl";

const LOADING_BACKGROUND_PATH = assetUrl("/assets/bg-site.webp");
const LOADING_FRAME_RATE = 12;
const LOADING_FRAME_INTERVAL_MS = 1000 / LOADING_FRAME_RATE;
const LOADING_LOGO_FRAMES = [
  assetUrl("/assets/loader/Loader-1.png"),
  assetUrl("/assets/loader/Loader-2.png"),
  assetUrl("/assets/loader/Loader-3.png"),
  assetUrl("/assets/loader/Loader-4.png"),
] as const;

for (const path of [LOADING_BACKGROUND_PATH, ...LOADING_LOGO_FRAMES]) {
  const image = new Image();
  image.src = path;
}

interface SceneLoadingOverlayProps {
  state: SceneLoadingState;
}

export function SceneLoadingOverlay({
  state,
}: SceneLoadingOverlayProps): React.JSX.Element | null {
  const [logoFrameIndex, setLogoFrameIndex] = useState(0);
  const isReady = state.status === "ready";
  const progress = Math.round(Math.max(0, Math.min(1, state.progress)) * 100);
  const logoFramePath =
    LOADING_LOGO_FRAMES[logoFrameIndex] ?? LOADING_LOGO_FRAMES[0];

  useEffect(() => {
    if (isReady) return undefined;

    const intervalId = window.setInterval(() => {
      setLogoFrameIndex(
        (currentIndex) => (currentIndex + 1) % LOADING_LOGO_FRAMES.length,
      );
    }, LOADING_FRAME_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady]);

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
        src={logoFramePath}
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
