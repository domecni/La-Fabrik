import { useEffect } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import { PYLON_NARRATIVE_DIALOGUES } from "@/data/gameplay/pylonConfig";

/**
 * Plays the narrator-outro audio sequence:
 *   1. electricienne_aurevoir  ("À la prochaine !")
 *   2. narrateur_courantrepare ("powerRestored")
 * then completes the pylon mission.
 */
export function PylonNarratorOutro(): null {
  const completeMission = useGameStore((state) => state.completeMission);
  const setCanMove = useGameStore((state) => state.setCanMove);

  useEffect(() => {
    let cancelled = false;
    setCanMove(false);

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled || !manifest) {
        setCanMove(true);
        return;
      }

      // 1. Électricienne : "À la prochaine !"
      const audio1 = await playDialogueById(
        manifest,
        PYLON_NARRATIVE_DIALOGUES.electricienneAurevoir,
      );
      if (audio1 && !cancelled) {
        await new Promise<void>((resolve) => {
          audio1.addEventListener("ended", () => resolve(), { once: true });
          audio1.addEventListener("error", () => resolve(), { once: true });
        });
      }

      if (cancelled) {
        setCanMove(true);
        return;
      }

      // 2. Narrateur : "Le courant est réparé"
      const audio2 = await playDialogueById(
        manifest,
        PYLON_NARRATIVE_DIALOGUES.powerRestored,
      );
      if (audio2 && !cancelled) {
        audio2.addEventListener(
          "ended",
          () => {
            setCanMove(true);
            completeMission("pylon");
          },
          { once: true },
        );
      } else {
        setCanMove(true);
        completeMission("pylon");
      }
    })();

    return () => {
      cancelled = true;
      setCanMove(true);
    };
  }, [completeMission, setCanMove]);

  return null;
}
