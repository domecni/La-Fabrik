import { useEffect } from "react";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { MissionStep } from "@/types/gameplay/repairMission";
import { assetUrl } from "@/utils/assetUrl";

const GAME_MUSIC_PATH = assetUrl("/sounds/musique/musique-jeu.mp3");
const REPAIR_MUSIC_PATH = assetUrl("/sounds/musique/musique-reparation.mp3");
const MUSIC_VOLUME = 0.33;

// Steps during which the repair mini-game owns the experience.
// Triggered when any mission (ebike / pylon / farm) is in this range.
const REPAIR_MUSIC_STEPS: ReadonlySet<MissionStep> = new Set([
  "inspected",
  "fragmented",
  "scanning",
  "repairing",
  "reassembling",
  "done",
]);

export function GameMusic(): null {
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const pylonStep = useGameStore((state) => state.pylon.currentStep);
  const farmStep = useGameStore((state) => state.farm.currentStep);

  const inRepair =
    REPAIR_MUSIC_STEPS.has(ebikeStep) ||
    REPAIR_MUSIC_STEPS.has(pylonStep) ||
    REPAIR_MUSIC_STEPS.has(farmStep);

  useEffect(() => {
    const audio = AudioManager.getInstance();
    audio.playMusic(
      inRepair ? REPAIR_MUSIC_PATH : GAME_MUSIC_PATH,
      MUSIC_VOLUME,
    );
  }, [inRepair]);

  useEffect(() => {
    const audio = AudioManager.getInstance();
    return () => {
      audio.stopMusic();
    };
  }, []);

  return null;
}
