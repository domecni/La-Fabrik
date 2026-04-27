import { useState } from "react";
import type { Octree } from "three/addons/math/Octree.js";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { DebugCameraControls } from "@/utils/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/utils/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { GameMap } from "@/components/game/GameMap";
import { PlayerComponent } from "@/world/player/PlayerComponent";
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
        <PlayerComponent octree={octree} spawnPosition={playerSpawnPosition} />
      ) : null}
    </>
  );
}
