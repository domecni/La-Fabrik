import { useEffect, useRef, useState } from "react";
import { MissionNotification } from "@/components/ui/MissionNotification";
import {
  EBIKE_BREAKDOWN_DIALOGUE_DELAY_MS,
  EBIKE_BREAKDOWN_DIALOGUE_ID,
  EBIKE_INTRO_RIDE_DURATION_MS,
  EBIKE_SOUNDS,
} from "@/data/ebike/ebikeConfig";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

export function EbikeIntroSequence(): React.JSX.Element | null {
  const introStep = useGameStore((state) => state.intro.currentStep);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const completeIntro = useGameStore((state) => state.completeIntro);
  const [breakdownDialogueDone, setBreakdownDialogueDone] = useState(false);
  const hasStartedBreakdown = useRef(false);

  useEffect(() => {
    if (introStep !== "await-ebike-mount" || movementMode !== "ebike") return;

    setIntroStep("ebike-intro-ride");
  }, [introStep, movementMode, setIntroStep]);

  useEffect(() => {
    if (introStep !== "ebike-intro-ride") return undefined;

    const timeoutId = window.setTimeout(() => {
      setIntroStep("ebike-breakdown");
    }, EBIKE_INTRO_RIDE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [introStep, setIntroStep]);

  useEffect(() => {
    if (introStep !== "ebike-breakdown" || hasStartedBreakdown.current) {
      return undefined;
    }

    hasStartedBreakdown.current = true;
    setBreakdownDialogueDone(false);
    window.ebikeBreakdownActive = true;
    AudioManager.getInstance().playSound(EBIKE_SOUNDS.panne, 0.95, {
      category: "sfx",
    });

    let isCancelled = false;
    const dialogueTimeoutId = window.setTimeout(() => {
      void (async () => {
        const manifest = await loadDialogueManifest();
        if (isCancelled || !manifest) {
          setBreakdownDialogueDone(true);
          return;
        }

        const audio = await playDialogueById(
          manifest,
          EBIKE_BREAKDOWN_DIALOGUE_ID,
        );
        if (isCancelled || !audio) {
          setBreakdownDialogueDone(true);
          return;
        }

        audio.addEventListener(
          "ended",
          () => {
            setBreakdownDialogueDone(true);
          },
          { once: true },
        );
      })();
    }, EBIKE_BREAKDOWN_DIALOGUE_DELAY_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(dialogueTimeoutId);
    };
  }, [introStep]);

  useEffect(() => {
    if (introStep !== "ebike-breakdown") return;
    if (!breakdownDialogueDone || movementMode !== "walk") return;

    window.ebikeBreakdownActive = false;
    completeIntro();
  }, [breakdownDialogueDone, completeIntro, introStep, movementMode]);

  useEffect(() => {
    if (introStep === "ebike-breakdown") return;

    window.ebikeBreakdownActive = false;
    if (introStep !== "completed") {
      hasStartedBreakdown.current = false;
    }
  }, [introStep]);

  if (introStep !== "await-ebike-mount" && introStep !== "ebike-intro-ride") {
    return null;
  }

  return (
    <MissionNotification
      mission="ebike"
      visible={introStep === "await-ebike-mount"}
    />
  );
}
