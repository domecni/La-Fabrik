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
import { SkyModel } from "@/components/three/world/SkyModel";
import { CloudSystem } from "@/world/clouds/CloudSystem";
import { FogSystem } from "@/world/fog/FogSystem";
import { GrassSystem } from "@/world/grass/GrassSystem";
import { SceneShadowWarmup } from "@/world/SceneShadowWarmup";
import { VegetationSystem } from "@/world/vegetation/VegetationSystem";
import { WaterSystem } from "@/world/water/WaterSystem";
import { WorldPlane } from "@/world/WorldPlane";

interface ShadowWarmupConfig {
  active: boolean;
  onReady: () => void;
  onStarted: () => void;
}

interface EnvironmentProps {
  shadowWarmup?: ShadowWarmupConfig;
}

export function Environment({
  shadowWarmup,
}: EnvironmentProps): React.JSX.Element {
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const showSky = isMapModelVisible("sky", { groups, models });

  if (sceneMode === "physics") {
    return (
      <color attach="background" args={[PHYSICS_SCENE_BACKGROUND_COLOR]} />
    );
  }

  return (
    <>
      <FogSystem />
      {shadowWarmup ? (
        <SceneShadowWarmup
          active={shadowWarmup.active}
          onReady={shadowWarmup.onReady}
          onStarted={shadowWarmup.onStarted}
        />
      ) : null}
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
      <VegetationSystem />
    </>
  );
}
