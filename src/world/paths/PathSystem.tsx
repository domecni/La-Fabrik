import { useEffect, useRef } from "react";
import * as THREE from "three";
import { InstancedMapAsset } from "@/world/map-instancing/InstancedMapAsset";
import {
  PATH_DEBUG_PREVIEW_ENABLED,
  PATH_TILE_RENDER_ENABLED,
  PATH_TILE_MODEL_PATH,
} from "@/data/world/pathConfig";
import { usePathTileData } from "@/world/paths/usePathTileData";
import type { MapAssetInstance } from "@/hooks/world/useMapInstancingData";

export function PathSystem(): React.JSX.Element | null {
  if (!PATH_DEBUG_PREVIEW_ENABLED && !PATH_TILE_RENDER_ENABLED) {
    return null;
  }

  return <PathTiles />;
}

function PathTiles(): React.JSX.Element | null {
  const pathTiles = usePathTileData();

  if (pathTiles.length === 0) {
    return null;
  }

  if (PATH_DEBUG_PREVIEW_ENABLED) {
    return <PathDebugPreview instances={pathTiles} />;
  }

  if (!PATH_TILE_RENDER_ENABLED) {
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

function PathDebugPreview({
  instances,
}: {
  instances: MapAssetInstance[];
}): React.JSX.Element {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const instancedMesh = instancedMeshRef.current;
    if (!instancedMesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      if (!instance) continue;

      position.set(
        instance.position[0],
        instance.position[1] + 0.08,
        instance.position[2],
      );
      matrix.compose(position, quaternion, scale);
      instancedMesh.setMatrixAt(i, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingSphere();
  }, [instances]);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, instances.length]}
    >
      <boxGeometry args={[0.35, 0.08, 0.35]} />
      <meshBasicMaterial color="#ff00ff" />
    </instancedMesh>
  );
}
