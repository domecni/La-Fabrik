import { useState, useCallback } from "react";
import type { Octree } from "three/addons/math/Octree.js";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { DebugCameraControls } from "@/utils/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/utils/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { Map } from "@/world/Map";
import { PlayerComponent } from "@/world/player/PlayerComponent";
import { TestScene } from "@/world/debug/TestScene";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const [octree, setOctree] = useState<Octree | null>(null);
  const onOctreeReady = useCallback((o: Octree) => setOctree(o), []);

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {cameraMode === "debug" ? <DebugCameraControls /> : null}

      {sceneMode === "game" ? (
        <Map onOctreeReady={onOctreeReady} />
      ) : (
        <TestScene onOctreeReady={onOctreeReady} />
      )}

      {cameraMode !== "debug" ? (
        <PlayerComponent
          octree={octree}
          spawnY={sceneMode === "game" ? 100 : 3}
        />
      ) : null}
    </>
  );
}
