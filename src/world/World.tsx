import { Suspense, useEffect } from "react";
import { Physics } from "@react-three/rapier";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/player/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useWorldSceneLoading } from "@/hooks/world/useWorldSceneLoading";
import { useGameStore } from "@/managers/stores/useGameStore";
import { GameFlow } from "@/components/game/GameFlow";
import {
  ZoneDebugVisuals,
  ZoneDetection,
} from "@/components/zone/ZoneDetection";
import { DebugCameraControls } from "@/components/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/components/debug/scene/DebugHelpers";
import { HandTrackingGlove } from "@/components/three/handTracking/HandTrackingGlove";
import { PyloneDestroyed } from "@/components/three/interaction/PyloneDestroyed";
import { NPCHelper } from "@/components/three/interaction/NPCHelper";
import { Environment } from "@/world/Environment";
import { GameCinematics } from "@/world/GameCinematics";
import { GameDialogues } from "@/world/GameDialogues";
import { GameMusic } from "@/world/GameMusic";
import { Lighting } from "@/world/Lighting";
import { GameMap } from "@/world/GameMap";
import { GameStageContent } from "@/world/GameStageContent";
import { Player } from "@/world/player/Player";
import { TestMap } from "@/world/debug/TestMap";
import { NetTest } from "@/components/three/debug/NetTest";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";
import { EbikeGPSMap } from "@/components/ebike/EbikeGPSMap";

interface WorldProps {
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
}

export function World({ onLoadingStateChange }: WorldProps): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const mainState = useGameStore((state) => state.mainState);
  const { status, usageStatus } = useHandTrackingSnapshot();
  const {
    octree,
    gameplayReady,
    showGameStage,
    handleGameStageLoaded,
    handleGameMapLoaded,
    handleOctreeReady,
  } = useWorldSceneLoading({ sceneMode, onLoadingStateChange });
  const playerSpawnPosition =
    sceneMode === "game"
      ? PLAYER_SPAWN_POSITION_GAME
      : PLAYER_SPAWN_POSITION_PHYSICS;
  const showHandTrackingGloves =
    sceneMode === "physics" ||
    (status !== "idle" && usageStatus !== "inactive");
  const spawnPlayer =
    cameraMode !== "debug" &&
    (sceneMode === "game" ? gameplayReady : octree !== null);

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {showHandTrackingGloves ? (
        <Suspense fallback={null}>
          <HandTrackingGlove handedness="left" />
          <HandTrackingGlove handedness="right" />
        </Suspense>
      ) : null}
      {cameraMode === "debug" ? <DebugCameraControls /> : null}
      {sceneMode === "game" ? (
        <>
          <GameFlow />
          <ZoneDetection />
          <ZoneDebugVisuals />
          <NPCHelper position={[1, 12, -55]} />
          <PyloneDestroyed position={[1, 15, -45]} />
          <GameMap
            onLoaded={handleGameMapLoaded}
            onLoadingStateChange={onLoadingStateChange}
            onOctreeReady={handleOctreeReady}
          />
          {showGameStage ? (
            <Physics>
              <GameStageLoaded onLoaded={handleGameStageLoaded} />
              <GameStageContent />
            </Physics>
          ) : null}
          {spawnPlayer ? (
            <>
              <GameMusic />
              {mainState === "outro" ? <GameCinematics /> : null}
              <GameDialogues />
              <Player octree={octree} spawnPosition={playerSpawnPosition} />
            </>
          ) : null}
        </>
      ) : (
        <TestMap onOctreeReady={handleOctreeReady} />
      )}

      {sceneMode !== "game" && spawnPlayer ? (
        <Player octree={octree} spawnPosition={playerSpawnPosition} />
      ) : null}
    </>
  );
}

function GameStageLoaded({ onLoaded }: { onLoaded: () => void }): null {
  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return null;
}
