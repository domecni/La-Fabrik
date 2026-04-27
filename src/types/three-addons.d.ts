declare module "three/addons/math/Capsule.js" {
  import { Vector3 } from "three";

  export class Capsule {
    start: Vector3;
    end: Vector3;
    radius: number;

    constructor(start?: Vector3, end?: Vector3, radius?: number);

    set(start: Vector3, end: Vector3, radius: number): this;
    clone(): Capsule;
    copy(capsule: Capsule): this;
    getCenter(target: Vector3): Vector3;
    translate(v: Vector3): this;
  }
}

declare module "three/addons/math/Octree.js" {
  import { Object3D } from "three";
  import { Capsule } from "three/addons/math/Capsule.js";

  export interface CapsuleIntersectResult {
    normal: import("three").Vector3;
    depth: number;
  }

  export class Octree {
    constructor();
    fromGraphNode(group: Object3D): this;
    capsuleIntersect(capsule: Capsule): CapsuleIntersectResult | false;
  }
}
