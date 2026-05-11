import * as THREE from "three";

export interface ExplodedPart {
  object: THREE.Object3D;
  originalPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
}

interface ExplodedModelOptions {
  distance?: number;
  speed?: number;
}

const _center = new THREE.Vector3();
const _direction = new THREE.Vector3();

export class ExplodedModel {
  private readonly parts: ExplodedPart[] = [];
  private readonly distance: number;
  private readonly speed: number;
  private progress = 0;
  private targetProgress = 0;

  constructor(model: THREE.Object3D, options: ExplodedModelOptions = {}) {
    this.distance = options.distance ?? 1.2;
    this.speed = options.speed ?? 6;
    this.parts = this.createParts(model);
  }

  setSplit(split: boolean): void {
    this.targetProgress = split ? 1 : 0;
  }

  getParts(): readonly ExplodedPart[] {
    return this.parts;
  }

  update(delta: number): void {
    const diff = this.targetProgress - this.progress;
    if (Math.abs(diff) < 0.001) {
      this.progress = this.targetProgress;
    } else {
      this.progress += diff * Math.min(delta * this.speed, 1);
    }

    this.parts.forEach((part) => {
      part.object.position.lerpVectors(
        part.originalPosition,
        part.targetPosition,
        this.progress,
      );
    });
  }

  private createParts(model: THREE.Object3D): ExplodedPart[] {
    const root =
      model.children.length === 1 && model.children[0]
        ? model.children[0]
        : model;
    const directChildren = root.children.filter((child) => hasMesh(child));
    const sourceObjects =
      directChildren.length > 1 ? directChildren : getMeshes(root);

    if (sourceObjects.length === 0) return [];

    _center.set(0, 0, 0);
    sourceObjects.forEach((object) => _center.add(object.position));
    _center.divideScalar(sourceObjects.length);

    return sourceObjects.map((object, index) => {
      const originalPosition = object.position.clone();
      _direction.subVectors(originalPosition, _center);

      if (_direction.lengthSq() < 0.0001) {
        const angle = (index / sourceObjects.length) * Math.PI * 2;
        _direction.set(Math.cos(angle), 0.25, Math.sin(angle));
      }

      _direction.normalize();

      return {
        object,
        originalPosition,
        targetPosition: originalPosition
          .clone()
          .addScaledVector(_direction, this.distance),
      };
    });
  }
}

function hasMesh(object: THREE.Object3D): boolean {
  let found = false;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      found = true;
    }
  });
  return found;
}

function getMeshes(object: THREE.Object3D): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = [];
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });
  return meshes;
}
