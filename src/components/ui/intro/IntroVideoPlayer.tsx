import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";

const INTRO_VIDEO_PATH = "/cinematics/intro.mp4";
const SKIP_KEYS = new Set(["Enter", " "]);

/**
 * Full-screen video player for the intro cinematic.
 * Advances to the dialogue-intro step when the video ends or the user skips.
 */
export function IntroVideoPlayer(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setIntroStep = useGameStore((state) => state.setIntroStep);

  const handleVideoEnd = useCallback(() => {
    setIntroStep("dialogue-intro");
  }, [setIntroStep]);

  const handleSkip = useCallback(() => {
    videoRef.current?.pause();
    setIntroStep("dialogue-intro");
  }, [setIntroStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (SKIP_KEYS.has(event.key)) {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  return (
    <div
      role="region"
      aria-label="Vidéo d'introduction. Appuyez sur Entrée pour passer."
      onClick={handleSkip}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 1000,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO_PATH}
        autoPlay
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 32,
          right: 32,
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Appuyez pour passer
      </span>
    </div>
  );
}
