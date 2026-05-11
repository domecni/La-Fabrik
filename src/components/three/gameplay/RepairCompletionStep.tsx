import { useEffect, useState } from "react";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { RepairMissionCase } from "@/components/three/gameplay/RepairMissionCase";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { REPAIR_CASE_ANIMATION_DURATION } from "@/data/gameplay/repairCaseConfig";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairCompletionStepProps {
  config: RepairMissionConfig;
  onComplete: () => void;
}

export function RepairCompletionStep({
  config,
  onComplete,
}: RepairCompletionStepProps): React.JSX.Element {
  const [isClosingCase, setIsClosingCase] = useState(false);
  const [isExitingCase, setIsExitingCase] = useState(false);

  useEffect(() => {
    if (!isClosingCase) return undefined;

    const timeoutId = window.setTimeout(() => {
      setIsExitingCase(true);
    }, REPAIR_CASE_ANIMATION_DURATION * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isClosingCase]);

  return (
    <group>
      <RepairMissionCase
        config={config}
        exiting={isExitingCase}
        open={!isClosingCase}
        onExitComplete={onComplete}
      />

      <RepairObjectModel
        label={config.label}
        modelPath={config.modelPath}
        scale={1}
      />

      {!isClosingCase ? (
        <TriggerObject
          position={[0, 1.1, 0]}
          colliders="ball"
          label={`Valider ${config.label}`}
          onTrigger={() => setIsClosingCase(true)}
        >
          <mesh>
            <torusGeometry args={[1.35, 0.045, 12, 96]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 1.25, 96]} />
            <meshBasicMaterial color="#bbf7d0" transparent opacity={0.3} />
          </mesh>
        </TriggerObject>
      ) : null}

      {!isClosingCase ? (
        <RepairPromptVideo src={config.stageUiPath} position={[0, 2.55, 0]} />
      ) : null}
    </group>
  );
}
