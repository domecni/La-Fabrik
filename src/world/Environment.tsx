import {
  GAME_SCENE_FALLBACK_BACKGROUND_COLOR,
  GAME_SCENE_FALLBACK_SKY_MODEL_PATH,
  GAME_SCENE_FALLBACK_SKY_MODEL_SCALE,
  GAME_SCENE_SKY_MODEL_PATH,
  GAME_SCENE_SKY_MODEL_SCALE,
  PHYSICS_SCENE_BACKGROUND_COLOR,
} from "@/data/world/environmentConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  isMapModelVisible,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";
import { SkyModel } from "@/components/three/world/SkyModel";

export function Environment(): React.JSX.Element {
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const showSky = isMapModelVisible("sky", { groups, models });

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return showSky ? (
    <SkyModel
      fallbackColor={GAME_SCENE_FALLBACK_BACKGROUND_COLOR}
      fallbackModelPath={GAME_SCENE_FALLBACK_SKY_MODEL_PATH}
      fallbackScale={GAME_SCENE_FALLBACK_SKY_MODEL_SCALE}
      modelPath={GAME_SCENE_SKY_MODEL_PATH}
      scale={GAME_SCENE_SKY_MODEL_SCALE}
    />
  ) : (
    <color attach="background" args={[GAME_SCENE_FALLBACK_BACKGROUND_COLOR]} />
  );
}
