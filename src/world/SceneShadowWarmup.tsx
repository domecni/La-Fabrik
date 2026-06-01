import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface SceneShadowWarmupProps {
  active: boolean;
  onReady: () => void;
  onStarted: () => void;
}

function markShadowLightForUpdate(object: THREE.Object3D): void {
  if (
    !(
      object instanceof THREE.DirectionalLight ||
      object instanceof THREE.PointLight ||
      object instanceof THREE.SpotLight
    )
  ) {
    return;
  }

  if (!object.castShadow) return;

  object.updateMatrixWorld(true);
  object.shadow.camera.updateProjectionMatrix();
  object.shadow.needsUpdate = true;
}

function forceSceneShadowPass(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
): void {
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFShadowMap;
  gl.shadowMap.autoUpdate = true;
  gl.shadowMap.needsUpdate = true;

  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.updateMatrixWorld(true);
    }

    markShadowLightForUpdate(object);
  });
}

export function SceneShadowWarmup({
  active,
  onReady,
  onStarted,
}: SceneShadowWarmupProps): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!active) {
      isRunningRef.current = false;
      return undefined;
    }

    if (isRunningRef.current) return undefined;

    isRunningRef.current = true;
    onStarted();
    forceSceneShadowPass(gl, scene);
    invalidate();

    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      forceSceneShadowPass(gl, scene);
      invalidate();

      secondFrame = window.requestAnimationFrame(() => {
        forceSceneShadowPass(gl, scene);
        invalidate();
        onReady();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [active, gl, invalidate, onReady, onStarted, scene]);

  return null;
}
