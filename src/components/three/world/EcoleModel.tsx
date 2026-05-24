import { useGLTF } from "@react-three/drei";
import { MergedStaticMapModel } from "@/components/three/world/MergedStaticMapModel";
import type { Vector3Tuple } from "@/types/three/three";

const ECOLE_MODEL_PATH = "/models/ecole/model.gltf";

interface EcoleModelProps {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoaded?: () => void;
}

export function EcoleModel(props: EcoleModelProps): React.JSX.Element {
  return <MergedStaticMapModel modelPath={ECOLE_MODEL_PATH} {...props} />;
}

useGLTF.preload(ECOLE_MODEL_PATH);
