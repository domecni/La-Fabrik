import {
  GAME_SCENE_FALLBACK_SKY_MODEL_PATH,
  GAME_SCENE_FALLBACK_SKY_MODEL_SCALE,
  GAME_SCENE_SKY_MODEL_PATH,
  GAME_SCENE_SKY_MODEL_SCALE,
  PHYSICS_SCENE_BACKGROUND_COLOR,
} from "@/data/world/environmentConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { SkyModel } from "@/components/three/world/SkyModel";

export function Environment(): React.JSX.Element {
  const sceneMode = useSceneMode();

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return (
    <SkyModel
      fallbackModelPath={GAME_SCENE_FALLBACK_SKY_MODEL_PATH}
      fallbackScale={GAME_SCENE_FALLBACK_SKY_MODEL_SCALE}
      modelPath={GAME_SCENE_SKY_MODEL_PATH}
      scale={GAME_SCENE_SKY_MODEL_SCALE}
    />
  );
}
