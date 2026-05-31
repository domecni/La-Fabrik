import { Suspense, useEffect } from "react";
import { Physics } from "@react-three/rapier";
import {
  PLAYER_SPAWN_POSITION_GAME,
  PLAYER_SPAWN_POSITION_PHYSICS,
} from "@/data/player/playerConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useEnvironmentDebug } from "@/hooks/debug/useEnvironmentDebug";
import { useMapPerformanceDebug } from "@/hooks/debug/useMapPerformanceDebug";
import { useCharacterDebug } from "@/hooks/debug/useCharacterDebug";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useWorldSceneLoading } from "@/hooks/world/useWorldSceneLoading";
import { useGameStore } from "@/managers/stores/useGameStore";
import { DebugCameraControls } from "@/components/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/components/debug/scene/DebugHelpers";
import { HandTrackingGlove } from "@/components/three/handTracking/HandTrackingGlove";
import { Environment } from "@/world/Environment";
import { GameCinematics } from "@/world/GameCinematics";
import { GameDialogues } from "@/world/GameDialogues";
import { GameMusic } from "@/world/GameMusic";
import { Lighting } from "@/world/Lighting";
import { GameMap } from "@/world/GameMap";
import { GameStageContent } from "@/world/GameStageContent";
import { CharacterSystem } from "@/world/characters/CharacterSystem";
import { Player } from "@/world/player/Player";
import { TestMap } from "@/world/debug/TestMap";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";

interface WorldProps {
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
}

export function World({ onLoadingStateChange }: WorldProps): React.JSX.Element {
  useEnvironmentDebug();
  useMapPerformanceDebug();
  useCharacterDebug();

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
    handleShadowWarmupReady,
    handleShadowWarmupStarted,
    shouldWarmUpShadows,
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
      <Environment
        shadowWarmup={{
          active: shouldWarmUpShadows,
          onReady: handleShadowWarmupReady,
          onStarted: handleShadowWarmupStarted,
        }}
      />
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
          <GameMap
            onLoaded={handleGameMapLoaded}
            onLoadingStateChange={onLoadingStateChange}
            onOctreeReady={handleOctreeReady}
          />
          {showGameStage && mainState !== "ebike" ? <CharacterSystem /> : null}
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
              {mainState !== "intro" ? <GameDialogues /> : null}
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
