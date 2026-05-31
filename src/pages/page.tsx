import { Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DebugPerf } from "@/components/debug/DebugPerf";
import { EbikeIntroSequence } from "@/components/game/EbikeIntroSequence";
import { DialogMessage } from "@/components/ui/DialogMessage";
import { GameUI } from "@/components/ui/GameUI";
import {
  FadeToVideoOverlay,
  IntroDialogueOverlay,
  IntroRevealOverlay,
  IntroVideoPlayer,
} from "@/components/ui/intro";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { INITIAL_SCENE_LOADING_STATE } from "@/data/world/sceneLoadingConfig";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { HandTrackingProvider } from "@/providers/gameplay/HandTrackingProvider";
import type { SceneLoadingState } from "@/types/world/sceneLoading";
import { hasSiteBeenVisitedToday } from "@/utils/cookies/siteVisitCookie";
import { logger } from "@/utils/core/Logger";
import { World } from "@/world/World";

const LOADING_TO_VIDEO_FADE_MS = 500;

export function HomePage(): React.JSX.Element | null {
  const navigate = useNavigate();
  const introStep = useGameStore((state) => state.intro.currentStep);
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const dialogMessage = useGameStore(
    (state) => state.missionFlow.dialogMessage,
  );
  const hideDialog = useGameStore((state) => state.hideDialog);
  const [sceneLoadingState, setSceneLoadingState] = useState<SceneLoadingState>(
    INITIAL_SCENE_LOADING_STATE,
  );

  useEffect(() => {
    if (!hasSiteBeenVisitedToday()) {
      navigate({ to: "/site", replace: true });
    }
  }, [navigate]);

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

  useEffect(() => {
    if (introStep === "loading-map" && sceneLoadingState.status === "ready") {
      AudioManager.getInstance().stopMusic();
      setIntroStep("fade-to-video");
    }
  }, [introStep, sceneLoadingState.status, setIntroStep]);

  useEffect(() => {
    if (introStep !== "fade-to-video") return undefined;

    const timeoutId = window.setTimeout(() => {
      setIntroStep("video");
    }, LOADING_TO_VIDEO_FADE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [introStep, setIntroStep]);

  const handleCanvasCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      const canvas = gl.domElement;

      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFShadowMap;
      gl.shadowMap.autoUpdate = true;

      // The browser hands us a WEBGL_lose_context extension we can use to
      // ask the GPU to restore the context after a loss. Without this the
      // page stays frozen on a black canvas until the user reloads.
      const loseContextExt = gl.getContext().getExtension("WEBGL_lose_context");

      const handleContextLost = (event: Event) => {
        event.preventDefault();
        logger.error("WebGL", "Context lost - attempting auto-restore");
        // Give the GPU a moment to free resources before asking it back.
        window.setTimeout(() => loseContextExt?.restoreContext(), 500);
      };

      const handleContextRestored = () => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.shadowMap.autoUpdate = true;
        logger.info("WebGL", "Context restored");
      };

      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    },
    [],
  );

  // Don't mount the Canvas until we know we will not redirect to /site.
  // Without this guard the Canvas would mount, the effect above would fire
  // navigate, and the Canvas would unmount mid-load — leaking GLTF requests
  // and a WebGL context. The synchronous cookie check happens here AFTER
  // all hooks (rules of hooks) but BEFORE any expensive render.
  if (!hasSiteBeenVisitedToday()) return null;

  const showFadeToVideoOverlay =
    introStep === "fade-to-video" ||
    (introStep === "loading-map" && sceneLoadingState.status === "ready");

  const renderIntroOverlay = () => {
    if (showFadeToVideoOverlay) return <FadeToVideoOverlay />;

    switch (introStep) {
      case "video":
        return <IntroVideoPlayer />;
      case "dialogue-intro":
        return <IntroDialogueOverlay />;
      case "reveal":
        return <IntroRevealOverlay />;
      default:
        return null;
    }
  };

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
      {dialogMessage ? (
        <DialogMessage
          message={dialogMessage}
          duration={3000}
          onClose={hideDialog}
        />
      ) : null}
      {(introStep === "loading-map" || introStep === "fade-to-video") && (
        <SceneLoadingOverlay state={sceneLoadingState} />
      )}
      {renderIntroOverlay()}
      <EbikeIntroSequence />
    </HandTrackingProvider>
  );
}
