import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CHUNK_CONFIG } from "@/data/world/chunkStreamingConfig";
import { selectMapModelPathByDistance } from "@/data/world/mapLodConfig";
import { useGraphicsPreset } from "@/hooks/world/useGraphicsSettings";

interface UseMapLodModelPathArgs {
  modelName: string;
  modelPath: string;
  position: readonly [number, number, number];
}

export function useMapLodModelPath({
  modelName,
  modelPath,
  position,
}: UseMapLodModelPathArgs): string {
  const camera = useThree((state) => state.camera);
  const graphicsPreset = useGraphicsPreset();
  const lastUpdateRef = useRef(-CHUNK_CONFIG.updateInterval);
  const initialModelPath = selectMapModelPathByDistance({
    distance: Math.hypot(
      position[0] - camera.position.x,
      position[2] - camera.position.z,
    ),
    modelName,
    modelPath,
    preset: graphicsPreset,
  });
  const activeModelPathRef = useRef(initialModelPath);
  const [activeModelPath, setActiveModelPath] = useState(initialModelPath);

  const updateModelPath = useCallback(() => {
    const distance = Math.hypot(
      position[0] - camera.position.x,
      position[2] - camera.position.z,
    );
    const nextModelPath = selectMapModelPathByDistance({
      distance,
      modelName,
      modelPath,
      preset: graphicsPreset,
    });

    if (nextModelPath === activeModelPathRef.current) return;

    activeModelPathRef.current = nextModelPath;
    setActiveModelPath(nextModelPath);
  }, [camera, graphicsPreset, modelName, modelPath, position]);

  useEffect(() => {
    updateModelPath();
  }, [updateModelPath]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime * 1000;
    if (now - lastUpdateRef.current < CHUNK_CONFIG.updateInterval) return;
    lastUpdateRef.current = now;

    updateModelPath();
  });

  return activeModelPath;
}
