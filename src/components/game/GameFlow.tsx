import { useEffect, useRef } from "react";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { AUDIO_PATHS } from "@/data/audioConfig";

export function GameFlow(): null {
  const step = useGameStore((state) => state.intro.currentStep);
  const setStep = useGameStore((state) => state.setIntroStep);
  const setActivityCity = useGameStore((state) => state.setActivityCity);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const completeIntro = useGameStore((state) => state.completeIntro);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && step === "intro") {
      hasInitialized.current = true;
      setStep("start-intro");
    }
  }, [step, setStep]);

  useEffect(() => {
    if (step === "start-intro") {
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.intro, 0.5, () => {
        setStep("naming");
      });

      return () => {};
    }

    if (step === "bienvenue") {
      const audio = AudioManager.getInstance();
      audio.playSoundWithCallback(AUDIO_PATHS.bienvenue, 0.5, () => {
        setCanMove(true);
        setStep("star-move");
      });

      return () => {};
    }

    if (step === "mission2") {
      setActivityCity(false);
      const audio = AudioManager.getInstance();
      audio.playSound(AUDIO_PATHS.alertCentral, 0.5);
    }

    if (step === "searching") {
      const audio = AudioManager.getInstance();
      audio.playSound(AUDIO_PATHS.searching, 0.5);
    }

    if (step === "helped") {
      const audio = AudioManager.getInstance();
      audio.playSound(AUDIO_PATHS.helped, 0.5);
    }

    if (step === "manipulation") {
      setCanMove(false);
      const timeoutId = window.setTimeout(() => {
        completeIntro();
      }, 1000);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [completeIntro, step, setStep, setActivityCity, setCanMove]);

  return null;
}
