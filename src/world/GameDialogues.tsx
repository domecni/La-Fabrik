import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { DialogueManifest } from "@/types/dialogues/dialogues";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import {
  clearQueuedDialogues,
  queueDialogueById,
} from "@/utils/dialogues/playDialogue";
import { logger } from "@/utils/core/Logger";

export function GameDialogues(): null {
  const [manifest, setManifest] = useState<DialogueManifest | null>(null);
  const playedDialoguesRef = useRef(new Set<string>());
  const activeAudiosRef = useRef(new Set<HTMLAudioElement>());
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const activeAudios = activeAudiosRef.current;

    void loadDialogueManifest()
      .then((loadedManifest) => {
        if (mounted) setManifest(loadedManifest);
      })
      .catch((error: unknown) => {
        logger.error("GameDialogues", "Failed to load dialogue manifest", {
          error: error instanceof Error ? error : String(error),
        });
      });

    return () => {
      mounted = false;
      clearQueuedDialogues();
      activeAudios.forEach((audio) => audio.pause());
      activeAudios.clear();
    };
  }, []);

  useFrame(({ clock }) => {
    if (!manifest) return;

    startedAtRef.current ??= clock.getElapsedTime();

    const elapsedTime = clock.getElapsedTime() - startedAtRef.current;

    manifest.dialogues.forEach((dialogue) => {
      if (dialogue.timecode === undefined) return;
      if (dialogue.timecode > elapsedTime) return;
      if (playedDialoguesRef.current.has(dialogue.id)) return;

      playedDialoguesRef.current.add(dialogue.id);

      void queueDialogueById(manifest, dialogue.id).then((audio) => {
        if (!audio) return;
        activeAudiosRef.current.add(audio);
        audio.addEventListener(
          "ended",
          () => activeAudiosRef.current.delete(audio),
          { once: true },
        );
      });
    });
  });

  return null;
}
