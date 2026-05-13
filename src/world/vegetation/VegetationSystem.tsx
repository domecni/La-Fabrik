import { Suspense } from "react";
import { InstancedVegetation } from "@/world/vegetation/InstancedVegetation";
import { useVegetationData } from "@/world/vegetation/useVegetationData";
import {
  VEGETATION_TYPES,
  type VegetationType,
} from "@/world/vegetation/vegetationConfig";

export function VegetationSystem(): React.JSX.Element | null {
  const { data, isLoading } = useVegetationData();

  if (isLoading || !data) {
    return null;
  }

  const enabledTypes = Object.entries(VEGETATION_TYPES).filter(
    ([, config]) => config.enabled,
  );

  return (
    <group name="vegetation-system">
      {enabledTypes.map(([type, config]) => {
        const instances = data.get(type as VegetationType);

        if (!instances || instances.length === 0) {
          return null;
        }

        return (
          <Suspense key={type} fallback={null}>
            <InstancedVegetation
              modelPath={config.modelPath}
              instances={instances}
              castShadow={config.castShadow}
              receiveShadow={config.receiveShadow}
            />
          </Suspense>
        );
      })}
    </group>
  );
}
