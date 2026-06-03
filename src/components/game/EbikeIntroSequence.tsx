import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MissionNotification } from "@/components/ui/MissionNotification";
import {
  EBIKE_BREAKDOWN_DIALOGUE_DELAY_MS,
  EBIKE_BREAKDOWN_DIALOGUE_ID,
  EBIKE_INTRO_BREAKDOWN_DISTANCE,
  EBIKE_SOUNDS,
} from "@/data/ebike/ebikeConfig";
import { INTRO_MISSION_NOTIFICATION_IMAGE_PATH } from "@/data/gameplay/missionNotifications";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

export function EbikeIntroSequence(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const introStep = useGameStore((state) => state.intro.currentStep);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const pylonStep = useGameStore((state) => state.pylon.currentStep);
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const completeIntro = useGameStore((state) => state.completeIntro);
  const [breakdownDialogueDone, setBreakdownDialogueDone] = useState(false);
  const hasStartedBreakdown = useRef(false);
  const rideDistance = useRef(0);
  const lastRidePosition = useRef<THREE.Vector3 | null>(null);
  const currentRidePosition = useRef(new THREE.Vector3());

  useEffect(() => {
    if (introStep !== "await-ebike-mount" || movementMode !== "ebike") return;

    setIntroStep("ebike-intro-ride");
  }, [introStep, movementMode, setIntroStep]);

  useEffect(() => {
    if (introStep !== "ebike-intro-ride") return;

    rideDistance.current = 0;
    lastRidePosition.current = null;
  }, [introStep]);

  useEffect(() => {
    if (introStep !== "ebike-intro-ride" || movementMode !== "ebike") {
      return undefined;
    }

    let animationFrameId = 0;
    const tick = () => {
      const parkedPosition = window.ebikeParkedPosition;
      if (parkedPosition) {
        currentRidePosition.current.set(...parkedPosition);
        if (!lastRidePosition.current) {
          lastRidePosition.current = currentRidePosition.current.clone();
        } else {
          rideDistance.current += currentRidePosition.current.distanceTo(
            lastRidePosition.current,
          );
          lastRidePosition.current.copy(currentRidePosition.current);
        }

        if (rideDistance.current >= EBIKE_INTRO_BREAKDOWN_DISTANCE) {
          setIntroStep("ebike-breakdown");
          return;
        }
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [introStep, movementMode, setIntroStep]);

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

  if (mainState === "pylon") {
    if (pylonStep === "approaching") {
      return <MissionNotification mission="pylon" visible />;
    }
    if (pylonStep === "narrator-outro") {
      return <MissionNotification mission="farm" visible />;
    }
    return null;
  }

  if (
    introStep !== "reveal" &&
    introStep !== "await-ebike-mount" &&
    introStep !== "ebike-intro-ride" &&
    introStep !== "ebike-breakdown"
  ) {
    return null;
  }

  if (introStep === "ebike-breakdown") {
    return <MissionNotification mission="ebike" />;
  }

  return (
    <MissionNotification
      imagePath={INTRO_MISSION_NOTIFICATION_IMAGE_PATH}
      visible={
        introStep === "reveal" ||
        introStep === "await-ebike-mount" ||
        introStep === "ebike-intro-ride"
      }
    />
  );
}
