import { useState } from "react";
import { Physics } from "@react-three/rapier";
import type { Octree } from "three/addons/math/Octree.js";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/player/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { DebugCameraControls } from "@/components/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/components/debug/scene/DebugHelpers";
import { HandTrackingGlove } from "@/components/three/handTracking/HandTrackingGlove";
import { Environment } from "@/world/Environment";
import { GameMusic } from "@/world/GameMusic";
import { Lighting } from "@/world/Lighting";
import { GameMap } from "@/world/GameMap";
import { GameStageContent } from "@/world/GameStageContent";
import { Player } from "@/world/player/Player";
import { TestMap } from "@/world/debug/TestMap";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const { status, usageStatus } = useHandTrackingSnapshot();
  const [octree, setOctree] = useState<Octree | null>(null);
  const playerSpawnPosition =
    sceneMode === "game"
      ? PLAYER_SPAWN_POSITION_GAME
      : PLAYER_SPAWN_POSITION_PHYSICS;
  const showHandTrackingGloves =
    sceneMode === "physics" ||
    (status !== "idle" && usageStatus !== "inactive");

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {showHandTrackingGloves ? (
        <>
          <HandTrackingGlove handedness="left" />
          <HandTrackingGlove handedness="right" />
        </>
      ) : null}
      {cameraMode === "debug" ? <DebugCameraControls /> : null}
      {sceneMode === "game" ? (
        <>
          <GameMusic />
          <GameMap onOctreeReady={setOctree} />
          <Physics>
            <GameStageContent />
          </Physics>
        </>
      ) : (
        <TestMap onOctreeReady={setOctree} />
      )}
      {cameraMode !== "debug" ? (
        <Player octree={octree} spawnPosition={playerSpawnPosition} />
      ) : null}
    </>
  );
}
