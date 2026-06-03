import * as THREE from "three";

export interface ExplodedPart {
  object: THREE.Object3D;
  originalPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
}

interface ExplodedModelOptions {
  distance?: number;
  speed?: number;
  /**
   * Fired exactly once each time the lerp converges on a target value
   * (1 = fully exploded, 0 = fully reassembled). Useful for chaining
   * the next mission step on actual animation completion rather than a
   * blind timer.
   */
  onSettled?: (settledAt: 0 | 1) => void;
}

const _center = new THREE.Vector3();
const _direction = new THREE.Vector3();

export class ExplodedModel {
  private readonly parts: ExplodedPart[] = [];
  private readonly distance: number;
  private readonly speed: number;
  private readonly onSettled?: (settledAt: 0 | 1) => void;
  private progress = 0;
  private targetProgress = 0;
  private settledAtTarget = true;

  constructor(model: THREE.Object3D, options: ExplodedModelOptions = {}) {
    this.distance = options.distance ?? 1.2;
    this.speed = options.speed ?? 6;
    if (options.onSettled) this.onSettled = options.onSettled;
    this.parts = this.createParts(model);
  }

  setSplit(split: boolean): void {
    const next = split ? 1 : 0;
    if (next !== this.targetProgress) {
      this.targetProgress = next;
      this.settledAtTarget = false;
    }
  }

  getParts(): readonly ExplodedPart[] {
    return this.parts;
  }

  update(delta: number): void {
    const diff = this.targetProgress - this.progress;
    if (Math.abs(diff) < 0.001) {
      this.progress = this.targetProgress;
      if (!this.settledAtTarget) {
        this.settledAtTarget = true;
        this.onSettled?.(this.targetProgress === 1 ? 1 : 0);
      }
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
    // Drill down through single-mesh-bearing branches until we find a node
    // with multiple mesh-bearing children (the natural "explosion group" the
    // modeler authored). Falls back to flat mesh list only if no such group
    // exists. This avoids exploding leaves in local space when wrapper nodes
    // (e.g. "Empty" + "Moto" > "Eclatement") sit above the actual group.
    let current = model;
    while (true) {
      const meshChildren = current.children.filter((child) => hasMesh(child));
      if (meshChildren.length === 1 && meshChildren[0]) {
        current = meshChildren[0];
        continue;
      }
      break;
    }
    const directChildren = current.children.filter((child) => hasMesh(child));
    const sourceObjects =
      directChildren.length > 1 ? directChildren : getMeshes(current);

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
