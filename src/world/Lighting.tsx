import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  PCFShadowMap,
  type AmbientLight,
  type DirectionalLight,
  type Object3D,
  type WebGLRenderer,
} from "three";
import {
  AMBIENT_INTENSITY_MAX,
  AMBIENT_INTENSITY_MIN,
  AMBIENT_INTENSITY_STEP,
  SHADOW_CONFIG,
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
import { LA_FABRIK_INTERIOR_LIGHT_POSITION } from "@/data/world/laFabrikConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useShadowMapWarmup } from "@/hooks/three/useShadowMapWarmup";
import { LIGHTING_STATE } from "@/world/lightingState";

function configureRendererShadows(gl: WebGLRenderer): void {
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = PCFShadowMap;
  gl.shadowMap.autoUpdate = true;
}

function configureSunShadow(sun: DirectionalLight, sunTarget: Object3D): void {
  sun.target = sunTarget;
  sun.shadow.autoUpdate = true;
  sun.shadow.bias = SHADOW_CONFIG.bias;
  sun.shadow.normalBias = SHADOW_CONFIG.normalBias;
  sun.shadow.mapSize.width = SHADOW_CONFIG.mapSize;
  sun.shadow.mapSize.height = SHADOW_CONFIG.mapSize;
  sun.shadow.camera.left = -SHADOW_CONFIG.cameraSize;
  sun.shadow.camera.right = SHADOW_CONFIG.cameraSize;
  sun.shadow.camera.top = SHADOW_CONFIG.cameraSize;
  sun.shadow.camera.bottom = -SHADOW_CONFIG.cameraSize;
  sun.shadow.camera.near = SHADOW_CONFIG.cameraNear;
  sun.shadow.camera.far = SHADOW_CONFIG.cameraFar;
  sun.shadow.camera.updateProjectionMatrix();
}

function placeSunRelativeToCamera(
  sun: DirectionalLight,
  sunTarget: Object3D,
  cameraPosition: { x: number; z: number },
): void {
  sunTarget.position.set(cameraPosition.x, 0, cameraPosition.z);
  sun.position.set(
    cameraPosition.x + LIGHTING_STATE.sunX,
    LIGHTING_STATE.sunY,
    cameraPosition.z + LIGHTING_STATE.sunZ,
  );
}

export function Lighting(): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const sunTarget = useRef<Object3D>(null);

  useEffect(() => {
    if (!sun.current || !sunTarget.current) return;

    configureRendererShadows(gl);
    configureSunShadow(sun.current, sunTarget.current);
    // Prime the sun + target onto the camera before the first shadow pass so
    // the initial shadow frustum already covers the visible scene; without
    // this, the first frame is rendered with the default (origin-centered)
    // frustum and shadows can appear absent until the player moves.
    placeSunRelativeToCamera(sun.current, sunTarget.current, camera.position);
  }, [camera, gl]);

  useShadowMapWarmup({ light: sun, scene, gl, invalidate });

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

    if (!sun.current || !sunTarget.current) return;

    placeSunRelativeToCamera(sun.current, sunTarget.current, camera.position);
    sunTarget.current.updateMatrixWorld();
    sun.current.color.set(LIGHTING_STATE.sunColor);
    sun.current.intensity = LIGHTING_STATE.sunIntensity;
    sun.current.updateMatrixWorld();
    sun.current.shadow.needsUpdate = true;
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
      <pointLight
        position={LA_FABRIK_INTERIOR_LIGHT_POSITION}
        color="#dbeafe"
        intensity={1.2}
        distance={14}
        decay={1.6}
      />
    </>
  );
}
