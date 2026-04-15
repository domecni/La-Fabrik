// # route path src/world/Map.tsx
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Debug } from "@/debug/Debug";

const MODEL_PATH = "/models/map/blocking/model.glb";

type MapDebugState = {
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  scale: number;
};

const DEFAULT_DEBUG_STATE: MapDebugState = {
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  rotationY: 0,
  scale: 1,
};

function centerModel(model: THREE.Object3D): number {
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());

  model.position.set(-center.x, -bounds.min.y, -center.z);

  return size.length() > 0 && size.length() < 10 ? 5 : 1;
}

export function Map(): React.JSX.Element {
  const root = useRef<THREE.Group>(null);
  const debugState = useRef<MapDebugState>({ ...DEFAULT_DEBUG_STATE });
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    debugState.current.scale = centerModel(model);
  }, [model]);

  useEffect(() => {
    const debug = Debug.getInstance();

    if (!debug.active) {
      return undefined;
    }

    const folder = debug.createFolder("Map");

    if (!folder) {
      return undefined;
    }

    folder
      .add(debugState.current, "positionX", -100, 100, 0.1)
      .name("Position X");
    folder
      .add(debugState.current, "positionY", -20, 50, 0.1)
      .name("Position Y");
    folder
      .add(debugState.current, "positionZ", -100, 100, 0.1)
      .name("Position Z");
    folder
      .add(debugState.current, "rotationY", -Math.PI, Math.PI, 0.01)
      .name("Rotation Y");
    folder.add(debugState.current, "scale", 0.1, 10, 0.01).name("Scale");

    return undefined;
  }, []);

  useFrame(() => {
    const currentRoot = root.current;

    if (!currentRoot) {
      return;
    }

    currentRoot.position.set(
      debugState.current.positionX,
      debugState.current.positionY,
      debugState.current.positionZ,
    );
    currentRoot.rotation.y = debugState.current.rotationY;
    currentRoot.scale.setScalar(debugState.current.scale);
  });

  return (
    <group ref={root}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
