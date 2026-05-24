import * as THREE from "three";

const TEXTURE_KEYS = [
  "map",
  "alphaMap",
  "aoMap",
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
] as const;

type TextureKey = (typeof TEXTURE_KEYS)[number];
type TexturedMaterial = THREE.Material &
  Partial<Record<TextureKey, THREE.Texture>>;

const optimizedTextures = new WeakSet<THREE.Texture>();

function optimizeTexture(texture: THREE.Texture, maxAnisotropy: number): void {
  if (optimizedTextures.has(texture)) return;

  optimizedTextures.add(texture);
  texture.anisotropy = Math.min(4, Math.max(1, maxAnisotropy));

  if (!(texture instanceof THREE.CompressedTexture)) {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }

  texture.needsUpdate = true;
}

function optimizeMaterialTextures(
  material: THREE.Material,
  maxAnisotropy: number,
): void {
  const texturedMaterial = material as TexturedMaterial;

  for (const key of TEXTURE_KEYS) {
    const texture = texturedMaterial[key];
    if (texture instanceof THREE.Texture) {
      optimizeTexture(texture, maxAnisotropy);
    }
  }
}

export function optimizeGLTFSceneTextures(
  scene: THREE.Object3D,
  maxAnisotropy: number,
): void {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        optimizeMaterialTextures(material, maxAnisotropy);
      }
      return;
    }

    optimizeMaterialTextures(child.material, maxAnisotropy);
  });
}
