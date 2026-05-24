import { useGLTF } from "@react-three/drei";
import { MergedStaticMapModel } from "@/components/three/world/MergedStaticMapModel";
import type { Vector3Tuple } from "@/types/three/three";

const FERME_VERTICALE_MODEL_PATH = "/models/fermeverticale/model.gltf";

interface FermeVerticaleModelProps {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoaded?: () => void;
}

export function FermeVerticaleModel(
  props: FermeVerticaleModelProps,
): React.JSX.Element {
  return (
    <MergedStaticMapModel modelPath={FERME_VERTICALE_MODEL_PATH} {...props} />
  );
}

useGLTF.preload(FERME_VERTICALE_MODEL_PATH);
