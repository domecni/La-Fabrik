import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight } from "three";
import {
  AMBIENT_INTENSITY_MAX,
  AMBIENT_INTENSITY_MIN,
  AMBIENT_INTENSITY_STEP,
  AMBIENT_LIGHT_COLOR,
  LIGHTING_DEFAULTS,
  SUN_INTENSITY_MAX,
  SUN_INTENSITY_MIN,
  SUN_INTENSITY_STEP,
  SUN_LIGHT_COLOR,
  SUN_X_MAX,
  SUN_X_MIN,
  SUN_X_STEP,
  SUN_Y_MAX,
  SUN_Y_MIN,
  SUN_Y_STEP,
  SUN_Z_MAX,
  SUN_Z_MIN,
  SUN_Z_STEP,
} from "@/data/lightingConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";

type LightingState = {
  ambientIntensity: number;
  sunIntensity: number;
  sunX: number;
  sunY: number;
  sunZ: number;
};

const LIGHTING_STATE: LightingState = { ...LIGHTING_DEFAULTS };

export function Lighting(): React.JSX.Element {
  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);

  useDebugFolder("Lighting", (folder) => {
    folder
      .add(
        LIGHTING_STATE,
        "ambientIntensity",
        AMBIENT_INTENSITY_MIN,
        AMBIENT_INTENSITY_MAX,
        AMBIENT_INTENSITY_STEP,
      )
      .name("Ambient");
    folder
      .add(
        LIGHTING_STATE,
        "sunIntensity",
        SUN_INTENSITY_MIN,
        SUN_INTENSITY_MAX,
        SUN_INTENSITY_STEP,
      )
      .name("Sun Intensity");
    folder
      .add(LIGHTING_STATE, "sunX", SUN_X_MIN, SUN_X_MAX, SUN_X_STEP)
      .name("Sun X");
    folder
      .add(LIGHTING_STATE, "sunY", SUN_Y_MIN, SUN_Y_MAX, SUN_Y_STEP)
      .name("Sun Y");
    folder
      .add(LIGHTING_STATE, "sunZ", SUN_Z_MIN, SUN_Z_MAX, SUN_Z_STEP)
      .name("Sun Z");
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
        color={AMBIENT_LIGHT_COLOR}
      />
      <directionalLight
        ref={sun}
        position={[
          LIGHTING_STATE.sunX,
          LIGHTING_STATE.sunY,
          LIGHTING_STATE.sunZ,
        ]}
        intensity={LIGHTING_STATE.sunIntensity}
        color={SUN_LIGHT_COLOR}
        castShadow
      />
    </>
  );
}
