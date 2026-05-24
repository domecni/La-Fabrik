import { useGLTF } from "@react-three/drei";
import { MergedStaticMapModel } from "@/components/three/world/MergedStaticMapModel";
import type { Vector3Tuple } from "@/types/three/three";

const GENERATEUR_MODEL_PATH = "/models/generateur/model.gltf";

interface GenerateurModelProps {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoaded?: () => void;
}

export function GenerateurModel(
  props: GenerateurModelProps,
): React.JSX.Element {
  return <MergedStaticMapModel modelPath={GENERATEUR_MODEL_PATH} {...props} />;
}

useGLTF.preload(GENERATEUR_MODEL_PATH);
