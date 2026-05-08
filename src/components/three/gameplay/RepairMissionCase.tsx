import {
  RepairCaseModel,
  type RepairCasePlaceholder,
} from "@/components/three/gameplay/RepairCaseModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import {
  REPAIR_CASE_FOCUS_POSITION,
  REPAIR_CASE_FOCUS_SCALE,
  REPAIR_CASE_MODEL_PATH,
} from "@/data/gameplay/repairCaseConfig";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairMissionCaseProps {
  config: RepairMissionConfig;
  exiting?: boolean;
  onPlaceholdersChange?:
    | ((placeholders: readonly RepairCasePlaceholder[]) => void)
    | undefined;
  onExitComplete?: (() => void) | undefined;
  open?: boolean;
  zoomed?: boolean;
  showFragmentationPrompt?: boolean;
}

export function RepairMissionCase({
  config,
  exiting = false,
  onPlaceholdersChange,
  onExitComplete,
  open = false,
  zoomed = false,
  showFragmentationPrompt = false,
}: RepairMissionCaseProps): React.JSX.Element {
  const casePosition = zoomed
    ? REPAIR_CASE_FOCUS_POSITION
    : config.case.position;
  const caseScale = zoomed ? REPAIR_CASE_FOCUS_SCALE : config.case.scale;

  return (
    <group>
      <RepairCaseModel
        modelPath={REPAIR_CASE_MODEL_PATH}
        exiting={exiting}
        onExitComplete={onExitComplete}
        onPlaceholdersChange={onPlaceholdersChange}
        open={open}
        floating={!zoomed}
        position={casePosition}
        rotation={config.case.rotation}
        scale={caseScale}
      />
      {showFragmentationPrompt && !exiting ? (
        <RepairPromptVideo
          src={config.interactUiPath}
          position={[casePosition[0], 2.4, casePosition[2]]}
          size={80}
        />
      ) : null}
    </group>
  );
}
