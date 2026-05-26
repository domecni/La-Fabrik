import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { FOG_CONFIG } from "@/data/world/fogConfig";
import { getWindVector } from "@/data/world/windConfig";
import { WATER_SHADER_CONFIG } from "@/data/world/waterConfig";
import type { WaterSurfaceConfig } from "@/data/world/waterConfig";
import { useWind } from "@/hooks/world/useWind";
import {
  WATER_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
} from "@/world/water/waterShaders";

export function WaterSurface({
  position,
  renderOrder,
  rotation,
  size,
}: WaterSurfaceConfig): React.JSX.Element {
  const scene = useThree((state) => state.scene);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const wind = useWind();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: WATER_SHADER_CONFIG.scale },
      uSmoothness: { value: WATER_SHADER_CONFIG.smoothness },
      uEdgeThreshold: { value: WATER_SHADER_CONFIG.edgeThreshold },
      uEdgeSoftness: { value: WATER_SHADER_CONFIG.edgeSoftness },
      uFlowX: { value: WATER_SHADER_CONFIG.flowX },
      uFlowZ: { value: WATER_SHADER_CONFIG.flowZ },
      uCellSpeed: { value: WATER_SHADER_CONFIG.cellSpeed },
      uNoiseScale: { value: WATER_SHADER_CONFIG.noiseScale },
      uNoiseFlowSpeed: { value: WATER_SHADER_CONFIG.noiseFlowSpeed },
      uDistortAmount: { value: WATER_SHADER_CONFIG.distortAmount },
      uBorderRadius: { value: WATER_SHADER_CONFIG.borderRadius },
      uBorderSoftness: { value: WATER_SHADER_CONFIG.borderSoftness },
      uDeepColor: { value: new THREE.Color(WATER_SHADER_CONFIG.deepColor) },
      uMidColor: { value: new THREE.Color(WATER_SHADER_CONFIG.midColor) },
      uMidPos: { value: WATER_SHADER_CONFIG.midPos },
      uHighlight: {
        value: new THREE.Color(WATER_SHADER_CONFIG.highlightColor),
      },
      uOpacity: { value: WATER_SHADER_CONFIG.opacity },
      uDeepOpacity: { value: WATER_SHADER_CONFIG.deepOpacity },
      uFogEnabled: { value: 0 },
      uFogNear: { value: FOG_CONFIG.near },
      uFogFar: { value: FOG_CONFIG.far },
      uFogColor: { value: new THREE.Color(FOG_CONFIG.color) },
    }),
    [],
  );

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;

    const windVector = getWindVector(wind);

    const {
      uFlowX,
      uFlowZ,
      uFogColor,
      uFogEnabled,
      uFogFar,
      uFogNear,
      uNoiseScale,
      uTime,
    } = material.uniforms;

    if (uTime) uTime.value = clock.getElapsedTime();
    if (uFlowX) uFlowX.value = WATER_SHADER_CONFIG.flowX + windVector.x;
    if (uFlowZ) uFlowZ.value = WATER_SHADER_CONFIG.flowZ + windVector.z;
    if (uNoiseScale) {
      uNoiseScale.value = WATER_SHADER_CONFIG.noiseScale * wind.noiseScale;
    }

    if (scene.fog instanceof THREE.Fog) {
      if (uFogEnabled) uFogEnabled.value = 1;
      if (uFogNear) uFogNear.value = scene.fog.near;
      if (uFogFar) uFogFar.value = scene.fog.far;
      if (uFogColor) uFogColor.value.copy(scene.fog.color);
    } else if (uFogEnabled) {
      uFogEnabled.value = 0;
    }
  });

  return (
    <mesh
      position={[
        position[0],
        position[1] + WATER_SHADER_CONFIG.depthOffset,
        position[2],
      ]}
      rotation={[-Math.PI / 2 + rotation[0], rotation[1], rotation[2]]}
      renderOrder={renderOrder}
    >
      <planeGeometry args={size} />
      <shaderMaterial
        ref={materialRef}
        attach="material"
        depthTest
        depthWrite={false}
        fragmentShader={WATER_FRAGMENT_SHADER}
        side={THREE.FrontSide}
        transparent
        uniforms={uniforms}
        vertexShader={WATER_VERTEX_SHADER}
      />
    </mesh>
  );
}
