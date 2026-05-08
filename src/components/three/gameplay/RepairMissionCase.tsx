import { RepairCaseModel } from "@/components/three/gameplay/RepairCaseModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { REPAIR_CASE_MODEL_PATH } from "@/data/gameplay/repairCaseConfig";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairMissionCaseProps {
  config: RepairMissionConfig;
  exiting?: boolean;
  onExitComplete?: (() => void) | undefined;
  open?: boolean;
  showFragmentationPrompt?: boolean;
}

export function RepairMissionCase({
  config,
  exiting = false,
  onExitComplete,
  open = false,
  showFragmentationPrompt = false,
}: RepairMissionCaseProps): React.JSX.Element {
  return (
    <group>
      <RepairCaseModel
        modelPath={REPAIR_CASE_MODEL_PATH}
        exiting={exiting}
        onExitComplete={onExitComplete}
        open={open}
        position={config.case.position}
        rotation={config.case.rotation}
        scale={config.case.scale}
      />
      {showFragmentationPrompt && !exiting ? (
        <RepairPromptVideo
          src={config.interactUiPath}
          position={[config.case.position[0], 2.4, config.case.position[2]]}
          size={80}
        />
      ) : null}
    </group>
  );
}
