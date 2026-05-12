import { useEffect, useRef } from "react";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { AUDIO_PATHS } from "@/data/audioConfig";

export function GameFlow(): null {
  const step = useGameStore((state) => state.intro.currentStep);
  const setStep = useGameStore((state) => state.setIntroStep);
  const setActivityCity = useGameStore((state) => state.setActivityCity);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log("[GameFlow] Current step:", step);
    if (!hasInitialized.current && step === "intro") {
      hasInitialized.current = true;
      console.log("[GameFlow] Transition to start-intro");
      setStep("start-intro");
    }
  }, [step, setStep]);

  useEffect(() => {
    console.log("[GameFlow] useEffect triggered, step:", step);

    if (step === "start-intro") {
      console.log("[GameFlow] Playing intro audio");
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.intro, 0.5, () => {
        console.log("[GameFlow] Intro audio ended, transition to naming");
        setStep("naming");
      });

      return () => {};
    }

    if (step === "bienvenue") {
      console.log("[GameFlow] Playing bienvenue audio");
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.bienvenue, 0.5, () => {
        console.log("[GameFlow] Bienvenue audio ended, enable movement");
        setCanMove(true);
        setStep("star-move");
      });

      return () => {};
    }

    if (step === "mission2") {
      console.log("[GameFlow] mission2 - setting activityCity to false");
      setActivityCity(false);
      const audio = AudioManager.getInstance();
      audio.playSound(AUDIO_PATHS.alertCentral, 0.5);
    }

    if (step === "searching") {
      console.log("[GameFlow] Playing searching audio");
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.searching, 0.5, () => {
        console.log("[GameFlow] searching audio ended");
      });

      return () => {};
    }

    if (step === "helped") {
      console.log("[GameFlow] Playing helped audio");
      const audio = AudioManager.getInstance();
      audio.playSound(AUDIO_PATHS.helped, 0.5);
    }

    if (step === "manipulation") {
      console.log("[GameFlow] manipulation - blocking movement");
      setCanMove(false);
    }

    return undefined;
  }, [step, setStep, setActivityCity, setCanMove]);

  return null;
}
