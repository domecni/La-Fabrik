import {
  GAME_SCENE_FALLBACK_BACKGROUND_COLOR,
  GAME_SCENE_SKY_FALLBACK_MODEL_PATH,
  GAME_SCENE_SKY_FALLBACK_MODEL_SCALE,
  GAME_SCENE_SKY_MODEL_PATH,
  GAME_SCENE_SKY_MODEL_SCALE,
  PHYSICS_SCENE_BACKGROUND_COLOR,
} from "@/data/world/environmentConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  isMapModelVisible,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";
import { useRepairFocusStore } from "@/managers/stores/useRepairFocusStore";
import { SkyModel } from "@/components/three/world/SkyModel";
import { CloudSystem } from "@/world/clouds/CloudSystem";
import { FogSystem } from "@/world/fog/FogSystem";
import { GrassSystem } from "@/world/grass/GrassSystem";
import { VegetationSystem } from "@/world/vegetation/VegetationSystem";
import { WaterSystem } from "@/world/water/WaterSystem";
import { WorldPlane } from "@/world/WorldPlane";

export function Environment(): React.JSX.Element {
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const showSky = isMapModelVisible("sky", { groups, models });
  // Hide vegetation while the repair focus bubble is active so the cocoon
  // shroud is not pierced by tall trees / bushes around the repair model.
  const repairFocusActive = useRepairFocusStore((state) => state.active);

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return (
    <>
      <FogSystem />
      {showSky ? (
        <SkyModel
          fallbackColor={GAME_SCENE_FALLBACK_BACKGROUND_COLOR}
          fallbackScale={GAME_SCENE_SKY_FALLBACK_MODEL_SCALE}
          fallbackModelPath={GAME_SCENE_SKY_FALLBACK_MODEL_PATH}
          modelPath={GAME_SCENE_SKY_MODEL_PATH}
          scale={GAME_SCENE_SKY_MODEL_SCALE}
        />
      ) : (
        <color
          attach="background"
          args={[GAME_SCENE_FALLBACK_BACKGROUND_COLOR]}
        />
      )}
      <WorldPlane />
      <WaterSystem />
      <CloudSystem />
      <GrassSystem />
      {repairFocusActive ? null : <VegetationSystem />}
    </>
  );
}
