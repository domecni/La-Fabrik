import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Material,
  Mesh,
  type DirectionalLight,
  type Scene,
  type WebGLRenderer,
} from "three";

interface UseShadowMapWarmupOptions {
  /** Light whose shadow map should be reallocated once the scene stabilizes. */
  light: React.RefObject<DirectionalLight | null>;
  scene: Scene;
  gl: WebGLRenderer;
  invalidate: () => void;
  /** Frames the mesh count must remain unchanged to consider the scene stable. */
  stableFramesThreshold?: number;
  /** Hard cap on how long we keep watching, in frames (~5s @60fps). */
  safetyCapFrames?: number;
  /** Sample mesh count every N frames to keep the traversal cost negligible. */
  sampleEveryFrames?: number;
}

export function useShadowMapWarmup({
  light,
  scene,
  gl,
  invalidate,
  stableFramesThreshold = 60,
  safetyCapFrames = 300,
  sampleEveryFrames = 6,
}: UseShadowMapWarmupOptions): void {
  const meshCountRef = useRef(0);
  const stableFramesRef = useRef(0);
  const watchFramesRef = useRef(0);
  const doneRef = useRef(false);

  useFrame(() => {
    if (doneRef.current || !light.current) return;

    watchFramesRef.current += 1;

    if (watchFramesRef.current % sampleEveryFrames === 0) {
      let meshCount = 0;
      scene.traverse((object) => {
        if (object instanceof Mesh) meshCount += 1;
      });

      if (meshCount !== meshCountRef.current) {
        meshCountRef.current = meshCount;
        stableFramesRef.current = 0;
      } else {
        stableFramesRef.current += sampleEveryFrames;
      }
    }

    const stableEnough = stableFramesRef.current >= stableFramesThreshold;
    const safetyCapReached = watchFramesRef.current >= safetyCapFrames;
    if (!stableEnough && !safetyCapReached) return;

    doneRef.current = true;
    reallocateShadowMap(light.current);
    invalidateAllMaterials(scene);
    forceShadowPass(gl, scene, light.current);
    invalidate();
  });
}

function reallocateShadowMap(light: DirectionalLight): void {
  const shadowMap = light.shadow.map;
  if (!shadowMap) return;

  shadowMap.dispose();
  light.shadow.map = null;
}

function invalidateAllMaterials(scene: Scene): void {
  const seen = new Set<Material>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      material.needsUpdate = true;
    }
  });
}

function forceShadowPass(
  gl: WebGLRenderer,
  scene: Scene,
  light: DirectionalLight,
): void {
  scene.updateMatrixWorld(true);
  light.target.updateMatrixWorld(true);
  light.updateMatrixWorld(true);
  light.shadow.camera.updateMatrixWorld(true);
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.needsUpdate = true;
  gl.shadowMap.needsUpdate = true;
}
