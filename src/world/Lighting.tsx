import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Mesh,
  PCFShadowMap,
  type AmbientLight,
  type DirectionalLight,
  type Object3D,
  type Scene,
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

// [diag] temporary helper: count shadow-casting/receiving meshes in the scene
function snapshotShadowMeshes(scene: Scene): {
  meshCount: number;
  castShadowCount: number;
  receiveShadowCount: number;
} {
  let meshCount = 0;
  let castShadowCount = 0;
  let receiveShadowCount = 0;
  scene.traverse((obj) => {
    if (obj instanceof Mesh) {
      meshCount += 1;
      if (obj.castShadow) castShadowCount += 1;
      if (obj.receiveShadow) receiveShadowCount += 1;
    }
  });
  return { meshCount, castShadowCount, receiveShadowCount };
}

export function Lighting(): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const sunTarget = useRef<Object3D>(null);
  const lastDiagAtRef = useRef(0);

  useEffect(() => {
    if (!sun.current || !sunTarget.current) return;

    configureSunShadow(sun.current, sunTarget.current);
    configureRendererShadows(gl);
    sun.current.shadow.needsUpdate = true;

    // [diag] one-shot scene snapshot to count shadow casters/receivers
    const counts = snapshotShadowMeshes(scene);
    console.log("[shadow:mount]", {
      shadowMapEnabled: gl.shadowMap.enabled,
      shadowMapType: gl.shadowMap.type,
      shadowAutoUpdate: gl.shadowMap.autoUpdate,
      sunCastShadow: sun.current.castShadow,
      hasShadowMap: !!sun.current.shadow.map,
      ...counts,
    });

    // [diag] temporary — track WebGL context loss/restore to correlate with shadow drops
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.log("[ctx:lost]", { timestamp: performance.now().toFixed(0) });
    };
    const handleContextRestored = () => {
      console.log("[ctx:restored]", {
        timestamp: performance.now().toFixed(0),
      });
      if (sun.current) {
        sun.current.shadow.needsUpdate = true;
      }
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl, scene]);

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

  useFrame(({ clock }) => {
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

    // [diag] periodic shadow pipeline check (every 2s)
    const now = clock.getElapsedTime();
    if (now - lastDiagAtRef.current > 2 && sun.current) {
      lastDiagAtRef.current = now;
      console.log("[shadow:tick]", {
        shadowMapEnabled: gl.shadowMap.enabled,
        shadowAutoUpdate: gl.shadowMap.autoUpdate,
        sunCastShadow: sun.current.castShadow,
        sunIntensity: sun.current.intensity,
        hasShadowMapTexture: !!sun.current.shadow.map?.texture,
        sunPos: sun.current.position.toArray().map((n) => Number(n.toFixed(2))),
        targetPos: sunTarget.current?.position
          .toArray()
          .map((n) => Number(n.toFixed(2))),
        renderCalls: gl.info.render.calls,
      });
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
