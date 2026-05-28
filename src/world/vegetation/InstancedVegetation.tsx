import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useTerrainHeightSampler } from "@/hooks/three/useTerrainHeight";
import type { VegetationInstance } from "@/types/map/mapScene";
import { useWind } from "@/hooks/world/useWind";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";

interface InstancedVegetationProps {
  modelPath: string;
  instances: VegetationInstance[];
  scaleMultiplier: number;
  castShadow: boolean;
  receiveShadow: boolean;
  windStrength: number;
  rotationOffset: readonly [number, number, number];
}

interface MeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

type WindShaderMaterial = THREE.Material & {
  userData: THREE.Material["userData"] & {
    windUniforms?: VegetationWindUniforms;
  };
};

interface VegetationWindUniforms {
  time: { value: number };
  direction: { value: number };
  speed: { value: number };
  strength: { value: number };
  noiseScale: { value: number };
}

const meshDataCache = new Map<string, MeshData[]>();

function updateVegetationWindUniforms(
  uniforms: VegetationWindUniforms,
  elapsedTime: number,
  direction: number,
  speed: number,
  strength: number,
  noiseScale: number,
): void {
  uniforms.time.value = elapsedTime;
  uniforms.direction.value = direction;
  uniforms.speed.value = speed;
  uniforms.strength.value = strength;
  uniforms.noiseScale.value = noiseScale;
}

function addWindWeightAttribute(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();

  const position = geometry.getAttribute("position");
  const bounds = geometry.boundingBox;
  if (!position || !bounds) return;

  const height = Math.max(bounds.max.y - bounds.min.y, 0.0001);
  const weights = new Float32Array(position.count);

  for (let index = 0; index < position.count; index++) {
    const y = position.getY(index);
    const normalizedHeight = THREE.MathUtils.clamp(
      (y - bounds.min.y) / height,
      0,
      1,
    );
    weights[index] = normalizedHeight * normalizedHeight;
  }

  geometry.setAttribute("aWindWeight", new THREE.BufferAttribute(weights, 1));
}

function applyVegetationWindMaterial(
  material: THREE.Material,
): WindShaderMaterial {
  const windMaterial = material as WindShaderMaterial;
  const windUniforms: VegetationWindUniforms = {
    time: { value: 0 },
    direction: { value: 0 },
    speed: { value: 0 },
    strength: { value: 0 },
    noiseScale: { value: 1 },
  };

  windMaterial.userData.windUniforms = windUniforms;

  windMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uVegetationWindTime = windUniforms.time;
    shader.uniforms.uVegetationWindDirection = windUniforms.direction;
    shader.uniforms.uVegetationWindSpeed = windUniforms.speed;
    shader.uniforms.uVegetationWindStrength = windUniforms.strength;
    shader.uniforms.uVegetationWindNoiseScale = windUniforms.noiseScale;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aWindWeight;
        uniform float uVegetationWindTime;
        uniform float uVegetationWindDirection;
        uniform float uVegetationWindSpeed;
        uniform float uVegetationWindStrength;
        uniform float uVegetationWindNoiseScale;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 instanceOffset = instanceMatrix[3].xz;
        #else
          vec2 instanceOffset = vec2(0.0);
        #endif
        vec2 windDirection = vec2(cos(uVegetationWindDirection), sin(uVegetationWindDirection));
        float windPhase = dot(instanceOffset + position.xz, windDirection) * uVegetationWindNoiseScale;
        float windWave = sin(windPhase + uVegetationWindTime * uVegetationWindSpeed);
        float windGust = sin(windPhase * 0.37 + uVegetationWindTime * uVegetationWindSpeed * 0.63);
        float windOffset = (windWave * 0.65 + windGust * 0.35) * uVegetationWindStrength * aWindWeight;
        transformed.xz += windDirection * windOffset;`,
      );
  };

  windMaterial.customProgramCacheKey = () => "vegetation-wind-v1";

  return windMaterial;
}

function extractMeshes(scene: THREE.Group): MeshData[] {
  const meshesByMaterial = new Map<
    string,
    { geometries: THREE.BufferGeometry[]; material: THREE.Material }
  >();
  scene.updateMatrixWorld(true);

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const material = Array.isArray(child.material)
      ? child.material[0]
      : child.material;
    if (!material) return;

    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);

    const existing = meshesByMaterial.get(material.uuid);
    if (existing) {
      existing.geometries.push(geometry);
    } else {
      meshesByMaterial.set(material.uuid, {
        geometries: [geometry],
        material: material.clone(),
      });
    }
  });

  return [...meshesByMaterial.values()]
    .map(({ geometries, material }) => {
      const mergedGeometry = mergeGeometries(geometries, false);

      for (const geometry of geometries) {
        if (geometry !== mergedGeometry) {
          geometry.dispose();
        }
      }

      if (!mergedGeometry) {
        material.dispose();
        return null;
      }

      addWindWeightAttribute(mergedGeometry);

      return {
        geometry: mergedGeometry,
        material: applyVegetationWindMaterial(material),
      };
    })
    .filter((meshData): meshData is MeshData => meshData !== null);
}

function createInstanceMatrices(
  instances: VegetationInstance[],
  scaleMultiplier: number,
  rotationOffset: readonly [number, number, number],
  geometryBottomY: number,
): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (const instance of instances) {
    const matrix = new THREE.Matrix4();

    position.set(...instance.position);
    scale.set(
      instance.scale[0] * scaleMultiplier,
      instance.scale[1] * scaleMultiplier,
      instance.scale[2] * scaleMultiplier,
    );
    position.y += -geometryBottomY * scale.y;
    rotation.set(
      instance.rotation[0] + rotationOffset[0],
      instance.rotation[1] + rotationOffset[1],
      instance.rotation[2] + rotationOffset[2],
    );
    quaternion.setFromEuler(rotation);
    matrix.compose(position, quaternion, scale);
    matrices.push(matrix);
  }

  return matrices;
}

function getMeshBottomY(meshDataList: MeshData[]): number {
  let bottomY = Number.POSITIVE_INFINITY;

  for (const meshData of meshDataList) {
    meshData.geometry.computeBoundingBox();
    const minY = meshData.geometry.boundingBox?.min.y;
    if (minY !== undefined) {
      bottomY = Math.min(bottomY, minY);
    }
  }

  return Number.isFinite(bottomY) ? bottomY : 0;
}

export function InstancedVegetation({
  modelPath,
  instances,
  scaleMultiplier,
  castShadow,
  receiveShadow,
  windStrength,
  rotationOffset,
}: InstancedVegetationProps): React.JSX.Element | null {
  const { scene } = useGLTF(modelPath);
  const wind = useWind();
  const terrainHeight = useTerrainHeightSampler();
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const groupRef = useRef<THREE.Group>(null);
  const windUniformsRef = useRef<VegetationWindUniforms[]>([]);

  const meshDataList = useMemo(() => {
    const cached = meshDataCache.get(modelPath);
    if (cached) return cached;

    optimizeGLTFSceneTextures(scene, maxAnisotropy);
    const extracted = extractMeshes(scene);
    meshDataCache.set(modelPath, extracted);
    return extracted;
  }, [maxAnisotropy, modelPath, scene]);
  const groundedInstances = useMemo(
    () =>
      instances.map((instance) => {
        const [x, y, z] = instance.position;
        const height = terrainHeight.getHeight(x, z);
        return {
          ...instance,
          position: [x, height ?? y, z] as VegetationInstance["position"],
        };
      }),
    [instances, terrainHeight],
  );
  const matrices = useMemo(
    () =>
      createInstanceMatrices(
        groundedInstances,
        scaleMultiplier,
        rotationOffset,
        getMeshBottomY(meshDataList),
      ),
    [groundedInstances, meshDataList, rotationOffset, scaleMultiplier],
  );

  const instancedMeshes = useMemo(() => {
    return meshDataList.map((meshData, index) => {
      const instancedMesh = new THREE.InstancedMesh(
        meshData.geometry,
        meshData.material,
        groundedInstances.length,
      );

      for (let i = 0; i < matrices.length; i++) {
        const matrix = matrices[i];
        if (matrix) {
          instancedMesh.setMatrixAt(i, matrix);
        }
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.castShadow = castShadow;
      instancedMesh.receiveShadow = receiveShadow;
      instancedMesh.name = `instanced-mesh-${index}`;
      instancedMesh.frustumCulled = true;
      instancedMesh.computeBoundingSphere();

      return instancedMesh;
    });
  }, [
    meshDataList,
    matrices,
    groundedInstances.length,
    castShadow,
    receiveShadow,
  ]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    for (const mesh of instancedMeshes) {
      group.add(mesh);
    }

    return () => {
      for (const mesh of instancedMeshes) {
        group.remove(mesh);
        mesh.dispose();
      }
    };
  }, [instancedMeshes]);

  useEffect(() => {
    windUniformsRef.current = meshDataList
      .map(
        (meshData) =>
          (meshData.material as WindShaderMaterial).userData.windUniforms,
      )
      .filter(
        (uniforms): uniforms is VegetationWindUniforms =>
          uniforms !== undefined,
      );
    return () => {
      windUniformsRef.current = [];
    };
  }, [meshDataList]);

  useFrame(({ clock }) => {
    for (const windUniforms of windUniformsRef.current) {
      updateVegetationWindUniforms(
        windUniforms,
        clock.elapsedTime,
        wind.direction,
        wind.speed,
        wind.strength * windStrength,
        wind.noiseScale,
      );
    }
  });

  if (groundedInstances.length === 0) {
    return null;
  }

  return <group ref={groupRef} />;
}
