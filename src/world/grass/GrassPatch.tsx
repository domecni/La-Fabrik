import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TERRAIN_SURFACE_PROJECTION } from "@/data/world/terrainConfig";
import { useTerrainHeightSampler } from "@/hooks/three/useTerrainHeight";
import { useWind } from "@/hooks/world/useWind";
import type { TerrainSurfaceData } from "@/types/world/terrainSurface";
import { sampleTerrainSurfaceAtXZ } from "@/utils/world/terrainSurfaceSampler";
import {
  getGrassTipColor,
  GRASS_CONFIG,
  GRASS_SURFACE_KEYS,
} from "@/world/grass/grassConfig";
import {
  grassFragmentShader,
  grassVertexShader,
} from "@/world/grass/grassShaders";

interface GrassPatchProps {
  chunkX: number;
  chunkZ: number;
  density: number;
  terrainSurfaceData: TerrainSurfaceData;
}

interface GrassBladeVertexData {
  color: number[];
  heightFactor: number;
  position: number[];
}

function random01(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function lerp(min: number, max: number, ratio: number): number {
  return min + (max - min) * ratio;
}

function createGrassMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexColors: true,
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWindDirection: { value: 0 },
      uWindSpeed: { value: 0 },
      uWindStrength: { value: 0 },
      uWindNoiseScale: { value: GRASS_CONFIG.windNoiseScale },
      uBendStrength: { value: GRASS_CONFIG.windBendStrength },
    },
  });
}

function addGrassBlade(
  positions: number[],
  colors: number[],
  bladeBases: number[],
  heightFactors: number[],
  windPhases: number[],
  basePosition: THREE.Vector3,
  yaw: number,
  width: number,
  height: number,
  baseColor: THREE.Color,
  tipColor: THREE.Color,
  windPhase: number,
): void {
  const rightX = Math.cos(yaw) * width * 0.5;
  const rightZ = Math.sin(yaw) * width * 0.5;
  const leanX = Math.cos(yaw + Math.PI * 0.5) * width * 0.22;
  const leanZ = Math.sin(yaw + Math.PI * 0.5) * width * 0.22;
  const vertexData: GrassBladeVertexData[] = [
    {
      position: [
        basePosition.x - rightX,
        basePosition.y,
        basePosition.z - rightZ,
      ],
      color: [baseColor.r, baseColor.g, baseColor.b],
      heightFactor: 0,
    },
    {
      position: [
        basePosition.x + rightX,
        basePosition.y,
        basePosition.z + rightZ,
      ],
      color: [baseColor.r, baseColor.g, baseColor.b],
      heightFactor: 0,
    },
    {
      position: [
        basePosition.x + leanX,
        basePosition.y + height,
        basePosition.z + leanZ,
      ],
      color: [tipColor.r, tipColor.g, tipColor.b],
      heightFactor: 1,
    },
  ];

  for (const vertex of vertexData) {
    positions.push(...vertex.position);
    colors.push(...vertex.color);
    bladeBases.push(basePosition.x, basePosition.y, basePosition.z);
    heightFactors.push(vertex.heightFactor);
    windPhases.push(windPhase);
  }
}

function createGrassGeometry(
  chunkX: number,
  chunkZ: number,
  density: number,
  terrainSurfaceData: TerrainSurfaceData,
  getHeight: (x: number, z: number) => number | null,
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const colors: number[] = [];
  const bladeBases: number[] = [];
  const heightFactors: number[] = [];
  const windPhases: number[] = [];
  const baseColor = new THREE.Color(GRASS_CONFIG.baseColor);
  const startX = chunkX * GRASS_CONFIG.chunkSize;
  const startZ = chunkZ * GRASS_CONFIG.chunkSize;
  const endX = startX + GRASS_CONFIG.chunkSize;
  const endZ = startZ + GRASS_CONFIG.chunkSize;
  const bladeBudget = Math.round(GRASS_CONFIG.maxBladesPerChunk * density);
  let bladeCount = 0;

  for (let x = startX; x < endX; x += GRASS_CONFIG.sampleStep) {
    for (let z = startZ; z < endZ; z += GRASS_CONFIG.sampleStep) {
      for (
        let bladeIndex = 0;
        bladeIndex < GRASS_CONFIG.bladesPerCell;
        bladeIndex++
      ) {
        if (bladeCount >= bladeBudget) break;

        const seed =
          (chunkX + 101) * 92821 +
          (chunkZ + 103) * 68917 +
          Math.round(x * 13) * 193 +
          Math.round(z * 17) * 389 +
          bladeIndex * 997;
        if (random01(seed) > density) continue;

        const sampleX = x + (random01(seed + 1) - 0.5) * GRASS_CONFIG.jitter;
        const sampleZ = z + (random01(seed + 2) - 0.5) * GRASS_CONFIG.jitter;
        const sample = sampleTerrainSurfaceAtXZ(
          terrainSurfaceData.imageData,
          sampleX,
          sampleZ,
          terrainSurfaceData.bounds,
          TERRAIN_SURFACE_PROJECTION,
        );

        if (!sample.key || !GRASS_SURFACE_KEYS.has(sample.key as never))
          continue;

        const height = getHeight(sampleX, sampleZ);
        if (height === null) continue;

        const heightRatio = random01(seed + 3);
        const widthRatio = random01(seed + 4);
        const tipColor = new THREE.Color(getGrassTipColor(sample.key));
        const basePosition = new THREE.Vector3(
          sampleX,
          height + GRASS_CONFIG.surfaceOffset,
          sampleZ,
        );

        addGrassBlade(
          positions,
          colors,
          bladeBases,
          heightFactors,
          windPhases,
          basePosition,
          random01(seed + 5) * Math.PI * 2,
          GRASS_CONFIG.bladeWidth * lerp(0.75, 1.25, widthRatio),
          lerp(
            GRASS_CONFIG.minBladeHeight,
            GRASS_CONFIG.maxBladeHeight,
            heightRatio,
          ),
          baseColor,
          tipColor,
          random01(seed + 6) * Math.PI * 2,
        );
        bladeCount += 1;
      }
    }
  }

  if (bladeCount === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute(
    "aBladeBase",
    new THREE.Float32BufferAttribute(bladeBases, 3),
  );
  geometry.setAttribute(
    "aHeightFactor",
    new THREE.Float32BufferAttribute(heightFactors, 1),
  );
  geometry.setAttribute(
    "aWindPhase",
    new THREE.Float32BufferAttribute(windPhases, 1),
  );
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

export function GrassPatch({
  chunkX,
  chunkZ,
  density,
  terrainSurfaceData,
}: GrassPatchProps): React.JSX.Element | null {
  const terrainHeight = useTerrainHeightSampler();
  const wind = useWind();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometry = useMemo(
    () =>
      createGrassGeometry(
        chunkX,
        chunkZ,
        density,
        terrainSurfaceData,
        terrainHeight.getHeight,
      ),
    [chunkX, chunkZ, density, terrainHeight.getHeight, terrainSurfaceData],
  );
  const material = useMemo(() => createGrassMaterial(), []);

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;

    const uniforms = currentMaterial.uniforms;
    if (uniforms.uTime) uniforms.uTime.value = clock.elapsedTime;
    if (uniforms.uWindDirection) uniforms.uWindDirection.value = wind.direction;
    if (uniforms.uWindSpeed) uniforms.uWindSpeed.value = wind.speed;
    if (uniforms.uWindStrength) uniforms.uWindStrength.value = wind.strength;
    if (uniforms.uWindNoiseScale) {
      uniforms.uWindNoiseScale.value =
        GRASS_CONFIG.windNoiseScale * wind.noiseScale;
    }
  });

  if (!geometry) return null;

  return <mesh geometry={geometry} material={material} frustumCulled />;
}
