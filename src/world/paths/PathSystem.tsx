import { InstancedMapAsset } from "@/world/map-instancing/InstancedMapAsset";
import { PATH_TILE_MODEL_PATH } from "@/world/paths/pathConfig";
import { usePathTileData } from "@/world/paths/usePathTileData";

export function PathSystem(): React.JSX.Element | null {
  const pathTiles = usePathTileData();

  if (pathTiles.length === 0) {
    return null;
  }

  return (
    <InstancedMapAsset
      castShadow={false}
      instances={pathTiles}
      modelPath={PATH_TILE_MODEL_PATH}
      receiveShadow
    />
  );
}
