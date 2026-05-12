import { Suspense } from "react";
import { Physics } from "@react-three/rapier";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/player/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useWorldSceneLoading } from "@/hooks/world/useWorldSceneLoading";
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
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";

interface WorldProps {
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
}

function hasBootFlag(name: string): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has(name);
}

export function World({ onLoadingStateChange }: WorldProps): React.JSX.Element {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const { status, usageStatus } = useHandTrackingSnapshot();
  const { octree, showGameStage, handleGameMapLoaded, handleOctreeReady } =
    useWorldSceneLoading({ sceneMode, onLoadingStateChange });
  const noCinematics = hasBootFlag("noCinematics");
  const noDialogues = hasBootFlag("noDialogues");
  const noMap = hasBootFlag("noMap");
  const noMusic = hasBootFlag("noMusic");
  const noOctree = hasBootFlag("noOctree");
  const noPlayer = hasBootFlag("noPlayer");
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
          {noMusic ? null : <GameMusic />}
          {noCinematics ? null : <GameCinematics />}
          {noDialogues ? null : <GameDialogues />}
          {noMap ? null : (
            <GameMap
              buildOctree={!noOctree}
              onLoaded={handleGameMapLoaded}
              onLoadingStateChange={onLoadingStateChange}
              onOctreeReady={handleOctreeReady}
            />
          )}
          {noMap || showGameStage ? (
            <Physics>
              <GameStageContent />
            </Physics>
          ) : null}
        </>
      ) : (
        <TestMap onOctreeReady={handleOctreeReady} />
      )}

      {cameraMode !== "debug" && !noPlayer ? (
        <Player octree={octree} spawnPosition={playerSpawnPosition} />
      ) : null}
    </>
  );
}
