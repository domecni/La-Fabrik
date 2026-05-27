import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FOG_LIGHTING_COLOR_MIX } from "@/data/world/fogConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useDebugStore } from "@/hooks/debug/useDebugStore";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useFogSettings } from "@/hooks/world/useFogSettings";
import { LIGHTING_STATE } from "@/world/lightingState";

const tempSunFogColor = new THREE.Color();

function getLightingFogColor(target: THREE.Color): THREE.Color {
  target.set(LIGHTING_STATE.ambientColor);
  target.multiplyScalar(FOG_LIGHTING_COLOR_MIX.ambient);
  tempSunFogColor.set(LIGHTING_STATE.sunColor);
  target.add(tempSunFogColor.multiplyScalar(FOG_LIGHTING_COLOR_MIX.sun));

  return target;
}

export function FogSystem(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const fog = useFogSettings();
  const fogEnabled = useDebugStore((debug) => debug.getFogEnabled());
  const scene = useThree((state) => state.scene);
  const fogColor = useMemo(() => getLightingFogColor(new THREE.Color()), []);
  const shouldShowFog =
    fogEnabled && sceneMode === "game" && cameraMode === "player";

  useFrame(() => {
    if (!scene.fog) return;

    getLightingFogColor(scene.fog.color);
  });

  if (!shouldShowFog) return null;

  if (fog.mode === "linear") {
    return <fog attach="fog" args={[fogColor, fog.near, fog.far]} />;
  }

  return <fogExp2 attach="fog" args={[fogColor, fog.density]} />;
}
