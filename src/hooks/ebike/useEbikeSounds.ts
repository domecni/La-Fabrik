import { useCallback, useEffect, useRef } from "react";
import { EBIKE_SOUNDS } from "@/data/ebike/ebikeConfig";
import { AudioManager } from "@/managers/AudioManager";

type EbikeSoundState = "idle" | "depart" | "roule" | "ralenti";

interface UpdateEbikeSoundsOptions {
  mounted: boolean;
  driving: boolean;
  breakdown: boolean;
}

function stopAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
}

export function useEbikeSounds(): (options: UpdateEbikeSoundsOptions) => void {
  const stateRef = useRef<EbikeSoundState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = useCallback(() => {
    stopAudio(audioRef.current);
    audioRef.current = null;
    stateRef.current = "idle";
  }, []);

  const playDepart = useCallback(() => {
    stopCurrent();
    const audio = AudioManager.getInstance().playSound(
      EBIKE_SOUNDS.depart,
      0.8,
      {
        category: "sfx",
      },
    );
    audioRef.current = audio;
    stateRef.current = "depart";
    audio.addEventListener(
      "ended",
      () => {
        if (stateRef.current !== "depart") return;
        if (window.ebikeDriveInputActive !== true) {
          stateRef.current = "idle";
          audioRef.current = null;
          return;
        }

        const rollingAudio = AudioManager.getInstance().playSound(
          EBIKE_SOUNDS.roule,
          0.72,
          { category: "sfx" },
        );
        rollingAudio.loop = true;
        audioRef.current = rollingAudio;
        stateRef.current = "roule";
      },
      { once: true },
    );
  }, [stopCurrent]);

  const playRalenti = useCallback(() => {
    stopCurrent();
    const audio = AudioManager.getInstance().playSound(
      EBIKE_SOUNDS.ralenti,
      0.72,
      {
        category: "sfx",
      },
    );
    audioRef.current = audio;
    stateRef.current = "ralenti";
    audio.addEventListener(
      "ended",
      () => {
        if (stateRef.current !== "ralenti") return;
        audioRef.current = null;
        stateRef.current = "idle";
      },
      { once: true },
    );
  }, [stopCurrent]);

  const update = useCallback(
    ({ mounted, driving, breakdown }: UpdateEbikeSoundsOptions) => {
      if (!mounted || breakdown) {
        stopCurrent();
        return;
      }

      if (driving) {
        if (stateRef.current === "idle" || stateRef.current === "ralenti") {
          playDepart();
        }
        return;
      }

      if (stateRef.current === "depart" || stateRef.current === "roule") {
        playRalenti();
      }
    },
    [playDepart, playRalenti, stopCurrent],
  );

  useEffect(() => stopCurrent, [stopCurrent]);

  return update;
}
