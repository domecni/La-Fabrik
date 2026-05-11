import { useCallback, useEffect, useState } from "react";
import type { Octree } from "three/addons/math/Octree.js";
import type { SceneMode } from "@/types/debug/debug";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";

interface UseWorldSceneLoadingOptions {
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
  sceneMode: SceneMode;
}

interface UseWorldSceneLoadingResult {
  octree: Octree | null;
  showGameStage: boolean;
  handleGameMapLoaded: () => void;
  handleOctreeReady: (octree: Octree) => void;
}

export function useWorldSceneLoading({
  onLoadingStateChange,
  sceneMode,
}: UseWorldSceneLoadingOptions): UseWorldSceneLoadingResult {
  const [octree, setOctree] = useState<Octree | null>(null);
  const [gameMapLoaded, setGameMapLoaded] = useState(false);
  const showGameStage = sceneMode === "game" && gameMapLoaded;
  const sceneReady =
    (sceneMode === "game" && gameMapLoaded) ||
    (sceneMode === "physics" && octree !== null);

  const handleGameMapLoaded = useCallback(() => {
    setGameMapLoaded(true);
  }, []);

  const handleOctreeReady = useCallback(
    (nextOctree: Octree) => {
      setOctree(nextOctree);
      onLoadingStateChange?.({
        currentStep: "Collision prête",
        progress: 0.92,
        status: "loading",
      });
    },
    [onLoadingStateChange],
  );

  useEffect(() => {
    onLoadingStateChange?.({
      currentStep: "Initialisation du jeu",
      progress: 0,
      status: "loading",
    });
  }, [onLoadingStateChange, sceneMode]);

  useEffect(() => {
    if (!sceneReady) return undefined;

    onLoadingStateChange?.({
      currentStep: "Gameplay prêt",
      progress: 0.96,
      status: "loading",
    });

    const timeoutId = window.setTimeout(() => {
      onLoadingStateChange?.({
        currentStep: "Gameplay prêt",
        progress: 1,
        status: "ready",
      });
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onLoadingStateChange, sceneReady]);

  return {
    octree,
    showGameStage,
    handleGameMapLoaded,
    handleOctreeReady,
  };
}
