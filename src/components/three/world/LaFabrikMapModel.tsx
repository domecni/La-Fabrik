import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";

const LA_FABRIK_MODEL_PATH = "/models/lafabrik/model.gltf";

type LaFabrikMapModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function LaFabrikMapModel(
  props: LaFabrikMapModelProps,
): React.JSX.Element {
  return <MergedStaticMapModel modelPath={LA_FABRIK_MODEL_PATH} {...props} />;
}

useGLTF.preload(LA_FABRIK_MODEL_PATH);
