import { useEffect, useRef, useState } from "react";

const OUTRO_VIDEO_SRC = "/cinematics/outro.mp4";

/**
 * Full-screen video overlay that plays once after the outro drone-shot
 * cinematic ends. Triggered by the "outro-cinematic-complete" window event
 * dispatched from GameCinematics.tsx.
 */
export function OutroVideoOverlay(): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function handleCinematicComplete(): void {
      setVisible(true);
    }

    window.addEventListener("outro-cinematic-complete", handleCinematicComplete);
    return () => {
      window.removeEventListener(
        "outro-cinematic-complete",
        handleCinematicComplete,
      );
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    void videoRef.current?.play();
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        src={OUTRO_VIDEO_SRC}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        playsInline
      />
    </div>
  );
}
