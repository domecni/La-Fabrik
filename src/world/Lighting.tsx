import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight } from "three";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";

type LightingState = {
  ambientIntensity: number;
  sunIntensity: number;
  sunX: number;
  sunY: number;
  sunZ: number;
};

const LIGHTING_STATE: LightingState = {
  ambientIntensity: 1.8,
  sunIntensity: 2.8,
  sunX: 60,
  sunY: 80,
  sunZ: 30,
};

export function Lighting(): React.JSX.Element {
  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);

  useDebugFolder("Lighting", (folder) => {
    folder.add(LIGHTING_STATE, "ambientIntensity", 0, 5, 0.1).name("Ambient");
    folder.add(LIGHTING_STATE, "sunIntensity", 0, 8, 0.1).name("Sun Intensity");
    folder.add(LIGHTING_STATE, "sunX", -100, 100, 1).name("Sun X");
    folder.add(LIGHTING_STATE, "sunY", 0, 150, 1).name("Sun Y");
    folder.add(LIGHTING_STATE, "sunZ", -100, 100, 1).name("Sun Z");
  });

  useFrame(() => {
    if (ambient.current) {
      ambient.current.intensity = LIGHTING_STATE.ambientIntensity;
    }

    if (sun.current) {
      sun.current.position.set(
        LIGHTING_STATE.sunX,
        LIGHTING_STATE.sunY,
        LIGHTING_STATE.sunZ,
      );
      sun.current.intensity = LIGHTING_STATE.sunIntensity;
    }
  });

  return (
    <>
      <ambientLight
        ref={ambient}
        intensity={LIGHTING_STATE.ambientIntensity}
        color="#dbeafe"
      />
      <directionalLight
        ref={sun}
        position={[
          LIGHTING_STATE.sunX,
          LIGHTING_STATE.sunY,
          LIGHTING_STATE.sunZ,
        ]}
        intensity={LIGHTING_STATE.sunIntensity}
        color="#fff7ed"
        castShadow
      />
    </>
  );
}
