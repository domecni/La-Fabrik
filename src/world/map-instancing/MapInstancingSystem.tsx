import { Suspense } from "react";
import { InstancedMapAsset } from "@/world/map-instancing/InstancedMapAsset";
import {
  MAP_INSTANCING_ASSETS,
  type MapInstancingAssetType,
} from "@/world/map-instancing/mapInstancingConfig";
import { useMapInstancingData } from "@/world/map-instancing/useMapInstancingData";

export function MapInstancingSystem(): React.JSX.Element | null {
  const { data, isLoading } = useMapInstancingData();

  if (isLoading || !data) {
    return null;
  }

  const enabledAssets = Object.entries(MAP_INSTANCING_ASSETS).filter(
    ([, config]) => config.enabled,
  );

  return (
    <group name="map-instancing-system">
      {enabledAssets.map(([type, config]) => {
        const instances = data.get(type as MapInstancingAssetType);

        if (!instances || instances.length === 0) {
          return null;
        }

        return (
          <Suspense key={type} fallback={null}>
            <InstancedMapAsset
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
