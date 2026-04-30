import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { RepairCaseModel } from "@/components/three/gameplay/RepairCaseModel";
import {
  REPAIR_CASE_CLOSE_SOUND_PATH,
  REPAIR_CASE_MODEL_PATH,
  REPAIR_CASE_OPEN_SOUND_PATH,
} from "@/data/gameplay/repairCaseConfig";
import { AudioManager } from "@/managers/AudioManager";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairCaseObjectProps {
  position: Vector3Tuple;
  open: boolean;
  onToggle: () => void;
}

export function RepairCaseObject({
  position,
  open,
  onToggle,
}: RepairCaseObjectProps): React.JSX.Element {
  return (
    <TriggerObject
      position={position}
      colliders="cuboid"
      label={open ? "Fermer la mallette" : "Ouvrir la mallette"}
      onTrigger={() => {
        AudioManager.getInstance().playSound(
          open ? REPAIR_CASE_CLOSE_SOUND_PATH : REPAIR_CASE_OPEN_SOUND_PATH,
        );
        onToggle();
      }}
    >
      <RepairCaseModel
        modelPath={REPAIR_CASE_MODEL_PATH}
        open={open}
        position={[0, -0.45, 0]}
        scale={1.5}
      />
    </TriggerObject>
  );
}
