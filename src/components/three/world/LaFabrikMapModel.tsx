import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";
import { getMapLodModelPath } from "@/data/world/mapLodConfig";
import { useMapLodModelPath } from "@/hooks/world/useMapLodModelPath";

const LA_FABRIK_MODEL_PATH = "/models/lafabrik/model.glb";
const LA_FABRIK_LOD_MODEL_PATH = getMapLodModelPath("lafabrik");

type LaFabrikMapModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function LaFabrikMapModel(
  props: LaFabrikMapModelProps,
): React.JSX.Element {
  const modelPath = useMapLodModelPath({
    modelName: "lafabrik",
    modelPath: LA_FABRIK_MODEL_PATH,
    position: props.position,
  });

  return <MergedStaticMapModel modelPath={modelPath} {...props} />;
}

useGLTF.preload(LA_FABRIK_MODEL_PATH);
if (LA_FABRIK_LOD_MODEL_PATH) {
  useGLTF.preload(LA_FABRIK_LOD_MODEL_PATH);
}
