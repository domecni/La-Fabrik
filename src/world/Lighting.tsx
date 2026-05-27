import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight, Object3D } from "three";
import {
  AMBIENT_INTENSITY_MAX,
  AMBIENT_INTENSITY_MIN,
  AMBIENT_INTENSITY_STEP,
  SUN_INTENSITY_MAX,
  SUN_INTENSITY_MIN,
  SUN_INTENSITY_STEP,
  SUN_X_MAX,
  SUN_X_MIN,
  SUN_X_STEP,
  SUN_Y_MAX,
  SUN_Y_MIN,
  SUN_Y_STEP,
  SUN_Z_MAX,
  SUN_Z_MIN,
  SUN_Z_STEP,
} from "@/data/world/lightingConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { LIGHTING_STATE } from "@/world/lightingState";

const SHADOW_MAP_SIZE = 2048;
const SHADOW_CAMERA_SIZE = 95;
const SHADOW_CAMERA_NEAR = 0.5;
const SHADOW_CAMERA_FAR = 300;

export function Lighting(): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const sunTarget = useRef<Object3D>(null);

  useEffect(() => {
    if (!sun.current || !sunTarget.current) return;

    sun.current.target = sunTarget.current;
    sun.current.shadow.autoUpdate = true;
    sun.current.shadow.needsUpdate = true;
    sun.current.shadow.mapSize.width = SHADOW_MAP_SIZE;
    sun.current.shadow.mapSize.height = SHADOW_MAP_SIZE;
    sun.current.shadow.camera.left = -SHADOW_CAMERA_SIZE;
    sun.current.shadow.camera.right = SHADOW_CAMERA_SIZE;
    sun.current.shadow.camera.top = SHADOW_CAMERA_SIZE;
    sun.current.shadow.camera.bottom = -SHADOW_CAMERA_SIZE;
    sun.current.shadow.camera.near = SHADOW_CAMERA_NEAR;
    sun.current.shadow.camera.far = SHADOW_CAMERA_FAR;
    sun.current.shadow.camera.updateProjectionMatrix();
  }, []);

  useDebugFolder("Lighting", (folder) => {
    folder.addColor(LIGHTING_STATE, "ambientColor").name("Ambient Color");
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
    folder.addColor(LIGHTING_STATE, "sunColor").name("Sun Color");
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
      ambient.current.color.set(LIGHTING_STATE.ambientColor);
      ambient.current.intensity = LIGHTING_STATE.ambientIntensity;
    }

    if (sun.current && sunTarget.current) {
      sunTarget.current.position.set(camera.position.x, 0, camera.position.z);
      sunTarget.current.updateMatrixWorld();
      sun.current.position.set(
        camera.position.x + LIGHTING_STATE.sunX,
        LIGHTING_STATE.sunY,
        camera.position.z + LIGHTING_STATE.sunZ,
      );
      sun.current.color.set(LIGHTING_STATE.sunColor);
      sun.current.intensity = LIGHTING_STATE.sunIntensity;
      sun.current.updateMatrixWorld();
      sun.current.shadow.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight
        ref={ambient}
        intensity={LIGHTING_STATE.ambientIntensity}
        color={LIGHTING_STATE.ambientColor}
      />
      <directionalLight
        ref={sun}
        position={[
          LIGHTING_STATE.sunX,
          LIGHTING_STATE.sunY,
          LIGHTING_STATE.sunZ,
        ]}
        intensity={LIGHTING_STATE.sunIntensity}
        color={LIGHTING_STATE.sunColor}
        castShadow
      />
      <object3D ref={sunTarget} />
    </>
  );
}
