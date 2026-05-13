import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DebugPerf } from "@/components/debug/DebugPerf";
import { DialogMessage } from "@/components/ui/DialogMessage";
import { GameUI } from "@/components/ui/GameUI";
import { BienvenueDisplay, IntroUI } from "@/components/ui/IntroUI";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { useGameStore } from "@/managers/stores/useGameStore";
import { HandTrackingProvider } from "@/providers/gameplay/HandTrackingProvider";
import {
  INITIAL_SCENE_LOADING_STATE,
  type SceneLoadingState,
} from "@/types/world/sceneLoading";
import { logger } from "@/utils/core/Logger";
import { World } from "@/world/World";

export function HomePage(): React.JSX.Element {
  const dialogMessage = useGameStore(
    (state) => state.missionFlow.dialogMessage,
  );
  const hideDialog = useGameStore((state) => state.hideDialog);
  const [sceneLoadingState, setSceneLoadingState] = useState<SceneLoadingState>(
    INITIAL_SCENE_LOADING_STATE,
  );

  useEffect(() => {
    if (!dialogMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      hideDialog();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dialogMessage, hideDialog]);

  const handleSceneLoadingStateChange = useCallback(
    (nextState: SceneLoadingState) => {
      setSceneLoadingState((currentState) => {
        if (currentState.status === "ready" && nextState.status === "loading") {
          return currentState;
        }

        return {
          ...nextState,
          progress: Math.max(currentState.progress, nextState.progress),
        };
      });
    },
    [],
  );

  const handleCanvasCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      const canvas = gl.domElement;

      const handleContextLost = (event: Event) => {
        event.preventDefault();
        logger.error("WebGL", "Context lost - GPU resources exhausted");
      };

      const handleContextRestored = () => {
        logger.info("WebGL", "Context restored");
      };

      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    },
    [],
  );

  return (
    <HandTrackingProvider>
      <Canvas
        camera={{ position: [85, 60, 85], fov: 42 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
        }}
        onCreated={handleCanvasCreated}
      >
        <Suspense fallback={null}>
          <World onLoadingStateChange={handleSceneLoadingStateChange} />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <GameUI />
      <IntroUI />
      <BienvenueDisplay />
      {dialogMessage ? (
        <DialogMessage
          message={dialogMessage}
          duration={3000}
          onClose={hideDialog}
        />
      ) : null}
      <SceneLoadingOverlay state={sceneLoadingState} />
    </HandTrackingProvider>
  );
}
