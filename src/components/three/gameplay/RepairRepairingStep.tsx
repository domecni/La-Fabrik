import { useCallback, useState } from "react";
import * as THREE from "three";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";
import type { Vector3Tuple } from "@/types/three/three";

const INSTALL_TARGET_POSITION: Vector3Tuple = [0, 0.8, 0];
const INSTALL_TARGET_VECTOR = new THREE.Vector3(...INSTALL_TARGET_POSITION);
const REPLACEMENT_START_POSITION: Vector3Tuple = [0, 1.35, 1.8];
const REPAIR_INSTALL_RADIUS = 1.1;

interface RepairRepairingStepProps {
  config: RepairMissionConfig;
  onRepair: () => void;
}

export function RepairRepairingStep({
  config,
  onRepair,
}: RepairRepairingStepProps): React.JSX.Element {
  const [isReplacementPlaced, setIsReplacementPlaced] = useState(false);
  const replacementPart = config.replacementParts[0];
  const replacementModelPath = replacementPart?.modelPath ?? config.modelPath;
  const replacementLabel = replacementPart?.label ?? config.label;
  const installColor = isReplacementPlaced ? "#22c55e" : "#f97316";
  const installFillColor = isReplacementPlaced ? "#86efac" : "#fed7aa";

  const handleReplacementPosition = useCallback((position: THREE.Vector3) => {
    const isPlaced =
      position.distanceTo(INSTALL_TARGET_VECTOR) <= REPAIR_INSTALL_RADIUS;
    setIsReplacementPlaced((current) =>
      current === isPlaced ? current : isPlaced,
    );
  }, []);

  return (
    <group>
      <TriggerObject
        position={INSTALL_TARGET_POSITION}
        colliders="ball"
        label={
          isReplacementPlaced
            ? `Installer ${replacementLabel}`
            : `Approcher ${replacementLabel}`
        }
        onTrigger={() => {
          if (!isReplacementPlaced) return;

          onRepair();
        }}
      >
        <mesh>
          <torusGeometry args={[0.95, 0.045, 12, 96]} />
          <meshBasicMaterial color={installColor} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.9, 96]} />
          <meshBasicMaterial
            color={installFillColor}
            transparent
            opacity={0.35}
          />
        </mesh>
      </TriggerObject>

      <GrabbableObject
        position={[
          config.case.position[0] + REPLACEMENT_START_POSITION[0],
          config.case.position[1] + REPLACEMENT_START_POSITION[1],
          config.case.position[2] + REPLACEMENT_START_POSITION[2],
        ]}
        colliders="ball"
        handControlled
        label={`Prendre ${replacementLabel}`}
        onPositionChange={handleReplacementPosition}
      >
        <RepairObjectModel
          label={replacementLabel}
          modelPath={replacementModelPath}
          scale={0.35}
        />
      </GrabbableObject>

      <RepairPromptVideo src={config.interactUiPath} position={[0, 2.3, 0]} />
    </group>
  );
}
