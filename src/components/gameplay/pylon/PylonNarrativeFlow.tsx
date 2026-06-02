import { useGameStore } from "@/managers/stores/useGameStore";
import { useDialoguePlayback } from "@/hooks/gameplay/useDialoguePlayback";
import { ZoneDetection } from "@/components/zone/ZoneDetection";
import { PylonFarmerNPC } from "@/components/gameplay/pylon/PylonFarmerNPC";
import { PylonNarratorOutro } from "@/components/gameplay/pylon/PylonNarratorOutro";
import { PYLON_APPROACH_ZONE, PYLON_ARRIVED_ZONE } from "@/data/gameplay/zones";
import { PYLON_NARRATIVE_DIALOGUES } from "@/data/gameplay/pylonConfig";

export function PylonNarrativeFlow(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);

  useDialoguePlayback({
    enabled: mainState === "pylon" && step === "approaching",
    dialogueId: PYLON_NARRATIVE_DIALOGUES.electricOutage,
  });

  useDialoguePlayback({
    enabled: mainState === "pylon" && step === "arrived",
    dialogueId: PYLON_NARRATIVE_DIALOGUES.searchCentral,
  });

  // narrator-outro audio sequence + completeMission are handled in PylonNarratorOutro

  if (mainState !== "pylon") return null;

  if (step === "locked") {
    return (
      <ZoneDetection
        key="pylon-approach"
        zone={PYLON_APPROACH_ZONE}
        onEnter={() => setMissionStep("pylon", "approaching")}
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

  if (step === "arrived" || step === "npc-return" || step === "inspected") {
    return <PylonFarmerNPC />;
  }

  if (step === "narrator-outro") {
    return <PylonNarratorOutro />;
  }

  return null;
}
