import { useEffect, useState } from "react";
import { RepairCompletionParticles } from "@/components/three/gameplay/RepairCompletionParticles";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import { REPAIR_REASSEMBLY_SECONDS } from "@/data/gameplay/repairGameConfig";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairReassemblyStepProps {
  config: RepairMissionConfig;
  onComplete: () => void;
}

export function RepairReassemblyStep({
  config,
  onComplete,
}: RepairReassemblyStepProps): React.JSX.Element {
  const [split, setSplit] = useState(true);

  useEffect(() => {
    const closeTimeoutId = window.setTimeout(() => {
      setSplit(false);
    }, 50);
    const completeTimeoutId = window.setTimeout(() => {
      onComplete();
    }, REPAIR_REASSEMBLY_SECONDS * 1000);

    return () => {
      window.clearTimeout(closeTimeoutId);
      window.clearTimeout(completeTimeoutId);
    };
  }, [onComplete]);

  return (
    <group>
      <ExplodableModel
        modelPath={config.modelPath}
        split={split}
        splitDistance={1.2}
      />
      <RepairCompletionParticles />
    </group>
  );
}
