import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";
import { getMapLodModelPath } from "@/data/world/mapLodConfig";
import { useMapLodModelPath } from "@/hooks/world/useMapLodModelPath";

const ECOLE_MODEL_PATH = "/models/ecole/model.gltf";
const ECOLE_LOD_MODEL_PATH = getMapLodModelPath("ecole");

type EcoleModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function EcoleModel(props: EcoleModelProps): React.JSX.Element {
  const modelPath = useMapLodModelPath({
    modelName: "ecole",
    modelPath: ECOLE_MODEL_PATH,
    position: props.position,
  });

  return <MergedStaticMapModel modelPath={modelPath} {...props} />;
}

useGLTF.preload(ECOLE_MODEL_PATH);
if (ECOLE_LOD_MODEL_PATH) {
  useGLTF.preload(ECOLE_LOD_MODEL_PATH);
}
