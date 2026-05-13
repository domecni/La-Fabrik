import * as THREE from "three";

export function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();

      if (Array.isArray(child.material)) {
        for (const material of child.material) {
          disposeMaterial(material);
        }
      } else if (child.material) {
        disposeMaterial(child.material);
      }
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  material.dispose();

  for (const key of Object.keys(material)) {
    const value = (material as Record<string, unknown>)[key];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}

export function disposeInstancedMesh(mesh: THREE.InstancedMesh): void {
  mesh.geometry?.dispose();

  if (Array.isArray(mesh.material)) {
    for (const material of mesh.material) {
      disposeMaterial(material);
    }
  } else if (mesh.material) {
    disposeMaterial(mesh.material);
  }

  mesh.dispose();
}
