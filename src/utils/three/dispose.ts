import * as THREE from "three";

type TextureMaterialKey = Extract<
  | keyof THREE.MeshBasicMaterial
  | keyof THREE.MeshStandardMaterial
  | keyof THREE.MeshPhysicalMaterial
  | keyof THREE.MeshToonMaterial,
  string
>;

type MaterialWithTextureSlots = THREE.Material &
  Partial<Record<TextureMaterialKey, THREE.Texture | null>>;

interface DisposeObject3DOptions {
  disposeTextures?: boolean;
}

const MATERIAL_TEXTURE_KEYS = [
  "alphaMap",
  "aoMap",
  "bumpMap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "gradientMap",
  "lightMap",
  "map",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "specularMap",
  "thicknessMap",
  "transmissionMap",
] as const satisfies readonly TextureMaterialKey[];

export function disposeObject3D(
  object: THREE.Object3D,
  options: DisposeObject3DOptions = {},
): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => disposeMaterial(material, options));
    } else if (child.material) {
      disposeMaterial(child.material, options);
    }
  });
}

function disposeMaterial(
  material: THREE.Material,
  options: DisposeObject3DOptions,
): void {
  material.dispose();
  if (!options.disposeTextures) return;

  const materialWithTextures = material as MaterialWithTextureSlots;

  for (const key of MATERIAL_TEXTURE_KEYS) {
    const value = materialWithTextures[key];

    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}
