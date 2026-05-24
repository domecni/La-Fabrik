import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  logModelLoadSuccess,
  type ModelLoadLogContext,
} from "@/utils/three/modelLoadLogger";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";

export function useLoggedGLTF(
  modelPath: string,
  context: Omit<ModelLoadLogContext, "modelPath">,
) {
  const gltf = useGLTF(modelPath);
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const hasLoggedRef = useRef(false);
  const { position, rotation, scale, scope } = context;

  useEffect(() => {
    optimizeGLTFSceneTextures(gltf.scene, maxAnisotropy);
  }, [gltf.scene, maxAnisotropy]);

  useEffect(() => {
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;
    logModelLoadSuccess({ modelPath, position, rotation, scale, scope }, gltf);
  }, [gltf, modelPath, position, rotation, scale, scope]);

  return gltf;
}
