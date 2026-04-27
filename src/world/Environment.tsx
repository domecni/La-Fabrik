import { Environment as DreiEnvironment } from "@react-three/drei";
import {
  GAME_SCENE_SKYBOX_PATH,
  PHYSICS_SCENE_BACKGROUND_COLOR,
} from "@/data/environmentConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";

export function Environment(): React.JSX.Element {
  const sceneMode = useSceneMode();

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return <DreiEnvironment background files={GAME_SCENE_SKYBOX_PATH} />;
}
