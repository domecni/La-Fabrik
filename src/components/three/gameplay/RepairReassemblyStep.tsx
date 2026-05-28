import { useEffect, useState } from "react";
import { RepairCompletionParticles } from "@/components/three/gameplay/RepairCompletionParticles";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import { REPAIR_REASSEMBLY_SECONDS } from "@/data/gameplay/repairGameConfig";
import type { RepairMissionConfig } from "@/types/gameplay/repairMission";

interface RepairReassemblyStepProps {
  config: RepairMissionConfig;
  onComplete: () => void;
}

export function RepairReassemblyStep({
  config,
  onComplete,
}: RepairReassemblyStepProps): React.JSX.Element {
  const [split, setSplit] = useState(true);
  const reassemblySeconds =
    config.reassemblySeconds ?? REPAIR_REASSEMBLY_SECONDS;

  useEffect(() => {
    const closeTimeoutId = window.setTimeout(() => {
      setSplit(false);
    }, 50);
    const completeTimeoutId = window.setTimeout(() => {
      onComplete();
    }, reassemblySeconds * 1000);

    return () => {
      window.clearTimeout(closeTimeoutId);
      window.clearTimeout(completeTimeoutId);
    };
  }, [onComplete, reassemblySeconds]);

  return (
    <group>
      <ExplodableModel
        modelPath={config.modelPath}
        scale={config.modelScale ?? 1}
        split={split}
        splitDistance={1.2}
      />
      <RepairCompletionParticles />
    </group>
  );
}
