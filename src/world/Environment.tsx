import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import {
  PHYSICS_SCENE_BACKGROUND_COLOR,
  SKYBOX_FACES,
} from "@/data/environmentConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";

function SkyBox(): React.JSX.Element {
  const texture = useLoader(THREE.CubeTextureLoader, [...SKYBOX_FACES]);

  return <primitive attach="background" object={texture} />;
}

export function Environment(): React.JSX.Element {
  const sceneMode = useSceneMode();

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return <SkyBox />;
}
