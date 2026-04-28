import { useState } from "react";
import type { Octree } from "three/addons/math/Octree.js";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/player/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { DebugCameraControls } from "@/components/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/components/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { GameMap } from "@/world/GameMap";
import { Player } from "@/world/player/Player";
import { TestScene } from "@/world/debug/TestScene";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const [octree, setOctree] = useState<Octree | null>(null);
  const playerSpawnPosition =
    sceneMode === "game"
      ? PLAYER_SPAWN_POSITION_GAME
      : PLAYER_SPAWN_POSITION_PHYSICS;

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {cameraMode === "debug" ? <DebugCameraControls /> : null}

      {sceneMode === "game" ? (
        <GameMap onOctreeReady={setOctree} />
      ) : (
        <TestScene onOctreeReady={setOctree} />
      )}

      {cameraMode !== "debug" ? (
        <Player octree={octree} spawnPosition={playerSpawnPosition} />
      ) : null}
    </>
  );
}
