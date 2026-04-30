import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { Vector3Tuple } from "@/types/three/three";

export interface SimpleModelConfig {
  modelPath: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple | number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

interface SimpleModelProps extends SimpleModelConfig {
  children?: React.ReactNode;
}

export function SimpleModel({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  children,
}: SimpleModelProps): React.JSX.Element {
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);

  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      {children ?? (
        <primitive
          object={model}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
    </group>
  );
}
