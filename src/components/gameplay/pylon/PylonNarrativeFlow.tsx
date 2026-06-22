import { useEffect } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useDialoguePlayback } from "@/hooks/gameplay/useDialoguePlayback";
import { ZoneDetection } from "@/components/zone/ZoneDetection";
import { PylonFarmerNPC } from "@/components/gameplay/pylon/PylonFarmerNPC";
import { PylonNarratorOutro } from "@/components/gameplay/pylon/PylonNarratorOutro";
import { PYLON_APPROACH_ZONE, PYLON_ARRIVED_ZONE } from "@/data/gameplay/zones";
import {
  PYLON_APPROACH_DELAY_MS,
  PYLON_NARRATIVE_DIALOGUES,
} from "@/data/gameplay/pylonConfig";
import { AudioManager } from "@/managers/AudioManager";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import { assetUrl } from "@/utils/assetUrl";

const PYLON_POWERDOWN_SFX = assetUrl("/sounds/effect/generateur-powerdown.mp3");
const PYLON_POWERUP_SFX = assetUrl("/sounds/effect/generateur-powerup.mp3");

export function PylonNarrativeFlow(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const setCanMove = useGameStore((state) => state.setCanMove);

  useEffect(() => {
    if (mainState !== "pylon" || step !== "tampon") return undefined;

    const timeoutId = window.setTimeout(() => {
      setMissionStep("pylon", "approaching");
    }, PYLON_APPROACH_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, setMissionStep, step]);

  // ── approaching : powerdown sfx → then electricOutage dialogue ────────────
  useEffect(() => {
    if (mainState !== "pylon" || step !== "approaching") return undefined;

    let isCancelled = false;
    setCanMove(false);

    void (async () => {
      // 1. Play the generator powerdown sound effect
      const sfx = AudioManager.getInstance().playSound(PYLON_POWERDOWN_SFX, 1, {
        category: "sfx",
      });

      // 2. Wait for it to finish (or skip if it can't load)
      if (sfx) {
        await new Promise<void>((resolve) => {
          sfx.addEventListener("ended", () => resolve(), { once: true });
          sfx.addEventListener("error", () => resolve(), { once: true });
        });
      }

      if (isCancelled) return;

      // 3. Play the narrative dialogue
      const manifest = await loadDialogueManifest();
      if (isCancelled || !manifest) {
        setCanMove(true);
        return;
      }

      const audio = await playDialogueById(
        manifest,
        PYLON_NARRATIVE_DIALOGUES.electricOutage,
      );

      if (isCancelled || !audio) {
        setCanMove(true);
        return;
      }

      audio.addEventListener(
        "ended",
        () => {
          setCanMove(true);
        },
        { once: true },
      );
    })();

    return () => {
      isCancelled = true;
      setCanMove(true);
    };
  }, [mainState, step, setCanMove]);

  // ── arrived : searchCentral dialogue (unchanged) ──────────────────────────
  useDialoguePlayback({
    enabled: mainState === "pylon" && step === "arrived",
    dialogueId: PYLON_NARRATIVE_DIALOGUES.searchCentral,
  });

  // ── inspected (demo skip) : jump straight to done after 5 s ─────────────
  useEffect(() => {
    if (mainState !== "pylon" || step !== "inspected") return undefined;

    const timeoutId = window.setTimeout(() => {
      setMissionStep("pylon", "done");
    }, 5_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, step, setMissionStep]);

  // ── done : powerup sfx + lighting revert → auto-transition to narrator-outro
  useEffect(() => {
    if (mainState !== "pylon" || step !== "done") return undefined;

    const sfx = AudioManager.getInstance().playSound(PYLON_POWERUP_SFX, 1, {
      category: "sfx",
    });

    if (sfx) {
      sfx.addEventListener(
        "ended",
        () => setMissionStep("pylon", "narrator-outro"),
        { once: true },
      );
      sfx.addEventListener(
        "error",
        () => setMissionStep("pylon", "narrator-outro"),
        { once: true },
      );
    } else {
      // Fallback if the audio can't load
      setMissionStep("pylon", "narrator-outro");
    }

    return undefined;
  }, [mainState, step, setMissionStep]);

  // narrator-outro audio sequence + completeMission are handled in PylonNarratorOutro

  if (mainState !== "pylon") return null;

  if (step === "locked") {
    return (
      <ZoneDetection
        key="pylon-approach"
        zone={PYLON_APPROACH_ZONE}
        onEnter={() => setMissionStep("pylon", "tampon")}
      />
    );
  }

  if (step === "approaching") {
    return (
      <ZoneDetection
        key="pylon-arrived"
        zone={PYLON_ARRIVED_ZONE}
        onEnter={() => setMissionStep("pylon", "arrived")}
      />
    );
  }

  if (
    step === "arrived" ||
    step === "npc-return" ||
    step === "inspected" ||
    step === "done"
  ) {
    return <PylonFarmerNPC />;
  }

  if (step === "narrator-outro") {
    return <PylonNarratorOutro />;
  }

  return null;
}
