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

function pushVector(target: number[], value: THREE.Vector3): void {
  target.push(value.x, value.y, value.z);
}

function pushColor(target: number[], value: THREE.Color): void {
  target.push(value.r, value.g, value.b);
}

function createGrassGeometry(density: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const bladeOrigins: number[] = [];
  const yaws: number[] = [];
  const bladeCount = Math.round(GRASS_CONFIG.bladeCount * density);
  const halfPatchSize = GRASS_CONFIG.patchSize * 0.5;

  for (let index = 0; index < bladeCount; index++) {
    const seed = index * 997;
    const origin = new THREE.Vector3(
      random01(seed + 1) * GRASS_CONFIG.patchSize - halfPatchSize,
      0,
      random01(seed + 2) * GRASS_CONFIG.patchSize - halfPatchSize,
    );
    const yawAngle = random01(seed + 3) * Math.PI * 2;
    const yaw = new THREE.Vector3(Math.sin(yawAngle), 0, -Math.cos(yawAngle));
    const colorIndex = Math.floor(random01(seed + 4) * GRASS_COLORS.length);
    const color = new THREE.Color(GRASS_COLORS[colorIndex] ?? GRASS_COLORS[0]);
    const markerColors = [
      new THREE.Color(0.1, 0, 0),
      new THREE.Color(0, 0, 0.1),
      new THREE.Color(1, 1, 1),
    ] as const;
    const uv = new THREE.Vector2(
      origin.x / GRASS_CONFIG.patchSize + 0.5,
      origin.z / GRASS_CONFIG.patchSize + 0.5,
    );

    for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
      pushVector(positions, origin);
      pushColor(colors, markerColors[vertexIndex] ?? markerColors[2]);
      pushVector(bladeOrigins, origin);
      pushVector(yaws, yaw);
      pushColor(colors, color);
      uvs.push(uv.x, uv.y);
    }
  }

  const geometry = new THREE.BufferGeometry();
  const markerColorValues: number[] = [];
  const bladeColorValues: number[] = [];

  for (let index = 0; index < colors.length; index += 6) {
    markerColorValues.push(
      colors[index] ?? 0,
      colors[index + 1] ?? 0,
      colors[index + 2] ?? 0,
    );
    bladeColorValues.push(
      colors[index + 3] ?? 0,
      colors[index + 4] ?? 0,
      colors[index + 5] ?? 0,
    );
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(markerColorValues, 3),
  );
  geometry.setAttribute(
    "aBladeColor",
    new THREE.Float32BufferAttribute(bladeColorValues, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "aBladeOrigin",
    new THREE.Float32BufferAttribute(bladeOrigins, 3),
  );
  geometry.setAttribute("aYaw", new THREE.Float32BufferAttribute(yaws, 3));
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
