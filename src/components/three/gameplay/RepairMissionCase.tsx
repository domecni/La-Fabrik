import {
  RepairCaseModel,
  type RepairCasePlaceholder,
} from "@/components/three/gameplay/RepairCaseModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import {
  REPAIR_CASE_FOCUS_POSITION,
  REPAIR_CASE_FOCUS_SCALE,
  REPAIR_CASE_MODEL_PATH,
} from "@/data/gameplay/repairCaseConfig";
import { REPAIR_INTERACTION_RADIUS } from "@/data/gameplay/repairGameConfig";
import type { RepairMissionConfig } from "@/types/gameplay/repairMission";
import type { Vector3Tuple } from "@/types/three/three";

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
  onInteract?: (() => void) | undefined;
}

export function RepairMissionCase({
  config,
  exiting = false,
  onPlaceholdersChange,
  onExitComplete,
  open = false,
  zoomed = false,
  showFragmentationPrompt = false,
  onInteract,
}: RepairMissionCaseProps): React.JSX.Element {
  const casePosition = zoomed
    ? REPAIR_CASE_FOCUS_POSITION
    : config.case.position;
  const caseScale = zoomed ? REPAIR_CASE_FOCUS_SCALE : config.case.scale;
  const modelPosition: Vector3Tuple = onInteract ? [0, 0, 0] : casePosition;

  return (
    <group>
      {onInteract ? (
        <TriggerObject
          position={casePosition}
          colliders="ball"
          label={`Ouvrir ${config.label}`}
          radius={REPAIR_INTERACTION_RADIUS}
          onTrigger={onInteract}
        >
          <RepairCaseModel
            modelPath={REPAIR_CASE_MODEL_PATH}
            exiting={exiting}
            onExitComplete={onExitComplete}
            onPlaceholdersChange={onPlaceholdersChange}
            open={open}
            floating={!zoomed}
            position={modelPosition}
            rotation={config.case.rotation}
            scale={caseScale}
          />
        </TriggerObject>
      ) : (
        <RepairCaseModel
          modelPath={REPAIR_CASE_MODEL_PATH}
          exiting={exiting}
          onExitComplete={onExitComplete}
          onPlaceholdersChange={onPlaceholdersChange}
          open={open}
          floating={!zoomed}
          position={modelPosition}
          rotation={config.case.rotation}
          scale={caseScale}
        />
      )}
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
