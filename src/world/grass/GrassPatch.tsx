import { useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useWind } from "@/hooks/world/useWind";
import {
  GRASS_BASE_COLOR,
  GRASS_COLORS,
  GRASS_CONFIG,
} from "@/data/world/grassConfig";
import {
  grassFragmentShader,
  grassVertexShader,
} from "@/world/grass/grassShaders";
import type { TerrainGrassSampler } from "@/world/grass/useTerrainGrassSampler";

interface GrassPatchProps {
  density: number;
  terrainSampler: TerrainGrassSampler;
}

function random01(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const GRASS_COLOR_VALUES = GRASS_COLORS.map((color) => new THREE.Color(color));
const MARKER_COLOR_VALUES = [0.1, 0, 0, 0, 0, 0.1, 1, 1, 1] as const;

function createGrassGeometry(density: number): THREE.BufferGeometry {
  const bladeCount = Math.round(GRASS_CONFIG.bladeCount * density);
  const vertexCount = bladeCount * 3;
  const positions = new Float32Array(vertexCount * 3);
  const markerColorValues = new Float32Array(vertexCount * 3);
  const bladeColorValues = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const bladeOrigins = new Float32Array(vertexCount * 3);
  const yaws = new Float32Array(vertexCount * 3);
  const halfPatchSize = GRASS_CONFIG.patchSize * 0.5;

  for (let index = 0; index < bladeCount; index++) {
    const seed = index * 997;
    const originX = random01(seed + 1) * GRASS_CONFIG.patchSize - halfPatchSize;
    const originY = 0;
    const originZ = random01(seed + 2) * GRASS_CONFIG.patchSize - halfPatchSize;
    const yawAngle = random01(seed + 3) * Math.PI * 2;
    const yawX = Math.sin(yawAngle);
    const yawY = 0;
    const yawZ = -Math.cos(yawAngle);
    const colorIndex = Math.floor(random01(seed + 4) * GRASS_COLORS.length);
    const color = GRASS_COLOR_VALUES[colorIndex] ?? GRASS_COLOR_VALUES[0];
    const uvX = originX / GRASS_CONFIG.patchSize + 0.5;
    const uvY = originZ / GRASS_CONFIG.patchSize + 0.5;

    for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
      const vertexOffset = index * 3 + vertexIndex;
      const vectorOffset = vertexOffset * 3;
      const uvOffset = vertexOffset * 2;
      const markerOffset = vertexIndex * 3;

      positions[vectorOffset] = originX;
      positions[vectorOffset + 1] = originY;
      positions[vectorOffset + 2] = originZ;

      markerColorValues[vectorOffset] = MARKER_COLOR_VALUES[markerOffset] ?? 1;
      markerColorValues[vectorOffset + 1] =
        MARKER_COLOR_VALUES[markerOffset + 1] ?? 1;
      markerColorValues[vectorOffset + 2] =
        MARKER_COLOR_VALUES[markerOffset + 2] ?? 1;

      bladeColorValues[vectorOffset] = color?.r ?? 0;
      bladeColorValues[vectorOffset + 1] = color?.g ?? 0;
      bladeColorValues[vectorOffset + 2] = color?.b ?? 0;

      bladeOrigins[vectorOffset] = originX;
      bladeOrigins[vectorOffset + 1] = originY;
      bladeOrigins[vectorOffset + 2] = originZ;

      yaws[vectorOffset] = yawX;
      yaws[vectorOffset + 1] = yawY;
      yaws[vectorOffset + 2] = yawZ;

      uvs[uvOffset] = uvX;
      uvs[uvOffset + 1] = uvY;
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(markerColorValues, 3),
  );
  geometry.setAttribute(
    "aBladeColor",
    new THREE.BufferAttribute(bladeColorValues, 3),
  );
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "aBladeOrigin",
    new THREE.BufferAttribute(bladeOrigins, 3),
  );
  geometry.setAttribute("aYaw", new THREE.BufferAttribute(yaws, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

function createGrassMaterial(
  terrainSampler: TerrainGrassSampler,
  noiseTexture: THREE.Texture,
  grassTexture: THREE.Texture,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    vertexColors: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uNoiseTexture: { value: noiseTexture },
      uDiffuseMap: { value: grassTexture },
      uHeightMap: { value: terrainSampler.heightTexture },
      uPlayerPosition: { value: new THREE.Vector3() },
      uBaseBladeColor: { value: new THREE.Color(GRASS_BASE_COLOR) },
      uBoundingBoxMin: {
        value: new THREE.Vector3(
          terrainSampler.bounds.minX,
          terrainSampler.minHeight,
          terrainSampler.bounds.minZ,
        ),
      },
      uBoundingBoxMax: {
        value: new THREE.Vector3(
          terrainSampler.bounds.maxX,
          terrainSampler.maxHeight,
          terrainSampler.bounds.maxZ,
        ),
      },
      uPatchSize: { value: GRASS_CONFIG.patchSize },
      uBladeWidth: { value: GRASS_CONFIG.bladeWidth },
      uWindDirection: { value: 0 },
      uWindSpeed: { value: 0 },
      uWindNoiseScale: { value: GRASS_CONFIG.windNoiseScale },
      uWindStrength: { value: GRASS_CONFIG.windStrength },
      uBaldPatchModifier: { value: GRASS_CONFIG.baldPatchModifier },
      uFalloffSharpness: { value: GRASS_CONFIG.falloffSharpness },
      uHeightNoiseFrequency: { value: GRASS_CONFIG.heightNoiseFrequency },
      uHeightNoiseAmplitude: { value: GRASS_CONFIG.heightNoiseAmplitude },
      uClumpFrequency: { value: GRASS_CONFIG.clumpFrequency },
      uClumpThreshold: { value: GRASS_CONFIG.clumpThreshold },
      uClumpSoftness: { value: GRASS_CONFIG.clumpSoftness },
      uZoneFrequency: { value: GRASS_CONFIG.zoneFrequency },
      uNoGrassZoneThreshold: { value: GRASS_CONFIG.noGrassZoneThreshold },
      uSparseZoneThreshold: { value: GRASS_CONFIG.sparseZoneThreshold },
      uMediumZoneThreshold: { value: GRASS_CONFIG.mediumZoneThreshold },
      uZoneSoftness: { value: GRASS_CONFIG.zoneSoftness },
      uNoGrassZoneHeight: { value: GRASS_CONFIG.noGrassZoneHeight },
      uSparseZoneHeight: { value: GRASS_CONFIG.sparseZoneHeight },
      uMediumZoneHeight: { value: GRASS_CONFIG.mediumZoneHeight },
      uTallZoneHeight: { value: GRASS_CONFIG.tallZoneHeight },
      uNoGrassZoneDensity: { value: GRASS_CONFIG.noGrassZoneDensity },
      uSparseZoneDensity: { value: GRASS_CONFIG.sparseZoneDensity },
      uMediumZoneDensity: { value: GRASS_CONFIG.mediumZoneDensity },
      uTallZoneDensity: { value: GRASS_CONFIG.tallZoneDensity },
      uMaxBendAngle: { value: GRASS_CONFIG.maxBendAngle },
      uMaxBladeHeight: { value: GRASS_CONFIG.maxBladeHeight },
      uRandomHeightAmount: { value: GRASS_CONFIG.randomHeightAmount },
      uSurfaceOffset: { value: GRASS_CONFIG.surfaceOffset },
    },
  });
}

export function GrassPatch({
  density,
  terrainSampler,
}: GrassPatchProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const wind = useWind();
  const [noiseTexture, grassTexture] = useTexture([
    "/textures/grass/noise.png",
    "/textures/grass/grass.jpg",
  ]) as [THREE.Texture, THREE.Texture];
  const grassTextures = useMemo(() => {
    const noise = noiseTexture.clone();
    const grass = grassTexture.clone();

    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    grass.wrapS = grass.wrapT = THREE.MirroredRepeatWrapping;
    noise.needsUpdate = true;
    grass.needsUpdate = true;

    return { grass, noise };
  }, [grassTexture, noiseTexture]);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometry = useMemo(() => createGrassGeometry(density), [density]);

  useEffect(() => {
    return () => {
      grassTextures.grass.dispose();
      grassTextures.noise.dispose();
    };
  }, [grassTextures]);

  const material = useMemo(
    () =>
      createGrassMaterial(
        terrainSampler,
        grassTextures.noise,
        grassTextures.grass,
      ),
    [grassTextures, terrainSampler],
  );

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;

    const uniforms = currentMaterial.uniforms;
    if (uniforms.uTime) uniforms.uTime.value = clock.elapsedTime;
    if (uniforms.uPlayerPosition) {
      uniforms.uPlayerPosition.value.copy(camera.position);
    }
    if (uniforms.uWindDirection) uniforms.uWindDirection.value = wind.direction;
    if (uniforms.uWindSpeed) uniforms.uWindSpeed.value = wind.speed;
    if (uniforms.uWindNoiseScale) {
      uniforms.uWindNoiseScale.value =
        GRASS_CONFIG.windNoiseScale * wind.noiseScale;
    }
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
