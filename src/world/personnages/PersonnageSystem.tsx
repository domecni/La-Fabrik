import { Suspense } from "react";
import { AnimatedModel } from "@/components/three/models/AnimatedModel";
import {
  PERSONNAGE_CONFIGS,
  PERSONNAGE_IDS,
  type PersonnageId,
} from "@/data/world/personnages/personnageConfig";
import { useTerrainSnappedPosition } from "@/hooks/three/useTerrainHeight";
import { usePersonnageDebugStore } from "@/managers/stores/usePersonnageDebugStore";

function PersonnageModel({ id }: { id: PersonnageId }): React.JSX.Element {
  const config = PERSONNAGE_CONFIGS[id];
  const state = usePersonnageDebugStore((store) => store.personnages[id]);
  const position = useTerrainSnappedPosition(state.position);

  return (
    <AnimatedModel
      modelPath={config.modelPath}
      defaultAnimation={state.animation}
      position={position}
      rotation={state.rotation}
      scale={state.scale}
    />
  );
}

export function PersonnageSystem(): React.JSX.Element {
  return (
    <group name="personnage-system">
      {PERSONNAGE_IDS.map((id) => (
        <Suspense key={id} fallback={null}>
          <PersonnageModel id={id} />
        </Suspense>
      ))}
    </group>
  );
}
