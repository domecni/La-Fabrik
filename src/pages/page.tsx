import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DebugPerf } from "@/components/debug/DebugPerf";
import { GameUI } from "@/components/ui/GameUI";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { HandTrackingProvider } from "@/providers/gameplay/HandTrackingProvider";
import {
  INITIAL_SCENE_LOADING_STATE,
  type SceneLoadingState,
} from "@/types/world/sceneLoading";
import { World } from "@/world/World";

export function HomePage(): React.JSX.Element {
  const [sceneLoadingState, setSceneLoadingState] = useState<SceneLoadingState>(
    INITIAL_SCENE_LOADING_STATE,
  );
  const handleSceneLoadingStateChange = useCallback(
    (nextState: SceneLoadingState) => {
      setSceneLoadingState((currentState) => {
        const shouldRestartProgress = currentState.status === "ready";

        return {
          ...nextState,
          progress: shouldRestartProgress
            ? nextState.progress
            : Math.max(currentState.progress, nextState.progress),
        };
      });
    },
    [],
  );

  return (
    <HandTrackingProvider>
      <Canvas
        camera={{ position: [85, 60, 85], fov: 42 }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <Suspense fallback={null}>
          <World onLoadingStateChange={handleSceneLoadingStateChange} />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <GameUI />
      <SceneLoadingOverlay state={sceneLoadingState} />
    </HandTrackingProvider>
  );
}
