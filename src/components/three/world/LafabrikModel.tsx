import { useGLTF } from "@react-three/drei";
import { MergedStaticMapModel } from "@/components/three/world/MergedStaticMapModel";
import type { Vector3Tuple } from "@/types/three/three";

const LAFABRIK_MODEL_PATH = "/models/lafabrik/model.gltf";

interface LafabrikModelProps {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoaded?: () => void;
}

export function LafabrikModel(props: LafabrikModelProps): React.JSX.Element {
  return <MergedStaticMapModel modelPath={LAFABRIK_MODEL_PATH} {...props} />;
}

useGLTF.preload(LAFABRIK_MODEL_PATH);
