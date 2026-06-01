import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

const MODEL_PATH = "/models/persoprincipal/model.gltf";
// Offset expressed in the camera's local space:
// - x: horizontal (0 = centered)
// - y: vertical relative to camera eye (negative = below)
// - z: forward (negative = in front of the camera)
const LOCAL_OFFSET = new THREE.Vector3(0, -1, -2.5);

const eulerHelper = new THREE.Euler();

export function DebugPlayerModel(): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
    return cloned;
  }, [scene]);

  useEffect(
    () => () => {
      model.clear();
    },
    [model],
  );

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (!group) return;

    // Place the model in front of the camera using its local space so it stays
    // visible regardless of the camera pitch (top-down ebike view, etc.).
    group.position.copy(LOCAL_OFFSET).applyMatrix4(camera.matrixWorld);

    // Keep the model upright and aligned with the camera yaw only.
    eulerHelper.setFromQuaternion(camera.quaternion, "YXZ");
    group.rotation.set(0, eulerHelper.y, 0);
  });

  return (
    <group ref={groupRef} frustumCulled={false}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
