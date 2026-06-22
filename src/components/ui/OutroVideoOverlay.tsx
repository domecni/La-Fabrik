import { useEffect, useRef, useState } from "react";
import type { AudioCategory } from "@/data/audioConfig";
import { AudioManager } from "@/managers/AudioManager";
import { assetUrl } from "@/utils/assetUrl";

const OUTRO_VIDEO_SRC = assetUrl("/cinematics/outro.mp4");
const TRANSITION_FADE_MS = 600;
const TRANSITION_HOLD_MS = 2000;
const TRANSITION_TEXT_FADE_MS = 500;
// Delay between "Next step :" appearing and "La ferme" fading in.
const TRANSITION_LAFERME_DELAY_MS = 500;

const MUTED_CATEGORIES: readonly AudioCategory[] = ["music", "sfx", "dialogue"];

type Stage =
  | "hidden"
  | "fading-in"
  | "showing-text"
  | "fading-text-out"
  | "video";

/**
 * End-of-demo overlay. Triggered by the "outro-cinematic-complete" window
 * event dispatched from GameCinematics.tsx.
 *
 * Sequence:
 *   1. Fade to black                                  (TRANSITION_FADE_MS)
 *   2. Reveal "Next step: La ferme" text + hold       (TRANSITION_HOLD_MS)
 *   3. Fade text out                                  (TRANSITION_TEXT_FADE_MS)
 *   4. Play `outro.mp4` full-screen with all game audio muted
 */
export function OutroVideoOverlay(): React.JSX.Element | null {
  const [stage, setStage] = useState<Stage>("hidden");
  const [lafermeVisible, setLafermeVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const savedVolumesRef = useRef<Partial<Record<AudioCategory, number>>>({});

  useEffect(() => {
    function handleCinematicComplete(): void {
      setStage("fading-in");
    }

    window.addEventListener(
      "outro-cinematic-complete",
      handleCinematicComplete,
    );
    return () => {
      window.removeEventListener(
        "outro-cinematic-complete",
        handleCinematicComplete,
      );
    };
  }, []);

  // Drive the transition timeline.
  useEffect(() => {
    if (stage === "fading-in") {
      const timer = window.setTimeout(
        () => setStage("showing-text"),
        TRANSITION_FADE_MS,
      );
      return () => window.clearTimeout(timer);
    }
    if (stage === "showing-text") {
      const timer = window.setTimeout(
        () => setStage("fading-text-out"),
        TRANSITION_HOLD_MS,
      );
      return () => window.clearTimeout(timer);
    }
    if (stage === "fading-text-out") {
      const timer = window.setTimeout(
        () => setStage("video"),
        TRANSITION_TEXT_FADE_MS,
      );
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [stage]);

  // Stagger the second word ("La ferme") so it fades in after "Next step :"
  // is already visible.
  useEffect(() => {
    if (stage === "showing-text") {
      const timer = window.setTimeout(
        () => setLafermeVisible(true),
        TRANSITION_LAFERME_DELAY_MS,
      );
      return () => window.clearTimeout(timer);
    }
    if (stage === "hidden" || stage === "fading-in") {
      // Reset the staged reveal so a re-triggered outro replays correctly.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLafermeVisible(false);
    }
    return undefined;
  }, [stage]);

  // Mute all game audio while the video is showing; restore on cleanup so
  // a re-mounted page doesn't stay silent.
  useEffect(() => {
    if (stage !== "video") return;

    const audioManager = AudioManager.getInstance();
    const saved: Partial<Record<AudioCategory, number>> = {};
    for (const category of MUTED_CATEGORIES) {
      saved[category] = audioManager.getCategoryVolume(category);
      audioManager.setCategoryVolume(category, 0);
    }
    savedVolumesRef.current = saved;

    void videoRef.current?.play();

    return () => {
      for (const category of MUTED_CATEGORIES) {
        const previous = savedVolumesRef.current[category];
        if (previous !== undefined) {
          audioManager.setCategoryVolume(category, previous);
        }
      }
      savedVolumesRef.current = {};
    };
  }, [stage]);

  if (stage === "hidden") return null;

  const showText = stage === "showing-text" || stage === "fading-text-out";
  const textOpacity = stage === "showing-text" ? 1 : 0;

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
        opacity: stage === "fading-in" ? 0 : 1,
        transition: `opacity ${TRANSITION_FADE_MS}ms ease-out`,
        pointerEvents: stage === "video" ? "auto" : "none",
      }}
      aria-hidden={stage !== "video"}
    >
      {showText ? (
        <div
          style={{
            color: "#F2F2F2",
            textAlign: "center",
            textShadow: "0 7px 14.4px rgba(0, 0, 0, 0.25)",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(24px, 4vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-1.3px",
            opacity: textOpacity,
            transition: `opacity ${TRANSITION_TEXT_FADE_MS}ms ease-in`,
          }}
        >
          Next step :{" "}
          <span
            style={{
              opacity: lafermeVisible ? 1 : 0,
              transition: `opacity ${TRANSITION_TEXT_FADE_MS}ms ease-in`,
            }}
          >
            La ferme
          </span>
        </div>
      ) : null}
      {stage === "video" ? (
        <video
          ref={videoRef}
          src={OUTRO_VIDEO_SRC}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          playsInline
        />
      ) : null}
    </div>
  );
}
