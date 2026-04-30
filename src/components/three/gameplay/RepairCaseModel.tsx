import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import {
  REPAIR_CASE_ANIMATION_DURATION,
  REPAIR_CASE_CLOSED_ROTATION_OFFSET_DEGREES,
  REPAIR_CASE_FLOAT_ACTIVATION_DISTANCE,
  REPAIR_CASE_FLOAT_DOWN_SPEED,
  REPAIR_CASE_FLOAT_HEIGHT,
  REPAIR_CASE_FLOAT_UP_SPEED,
  REPAIR_CASE_LID_NODE_NAME,
  REPAIR_CASE_OPEN_ROTATION_OFFSET_DEGREES,
  REPAIR_CASE_ROTATION_AMPLITUDE_DEGREES,
  REPAIR_CASE_ROTATION_RESET_SPEED,
} from "@/data/gameplay/repairCaseConfig";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairCaseModelProps {
  modelPath: string;
  open: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
}

const CASE_CLOSED_ROTATION_OFFSET_Z = THREE.MathUtils.degToRad(
  REPAIR_CASE_CLOSED_ROTATION_OFFSET_DEGREES,
);
const CASE_OPEN_ROTATION_OFFSET_Z = THREE.MathUtils.degToRad(
  REPAIR_CASE_OPEN_ROTATION_OFFSET_DEGREES,
);
const ROTATION_AMPLITUDE = THREE.MathUtils.degToRad(
  REPAIR_CASE_ROTATION_AMPLITUDE_DEGREES,
);

export function RepairCaseModel({
  modelPath,
  open,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RepairCaseModelProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Object3D | null>(null);
  const worldPosition = useRef(new THREE.Vector3());
  const floatHeight = useRef(0);
  const animationActiveRef = useRef(false);
  const phase = useRef({ x: 0, y: 0, z: 0 });
  const initialOpen = useRef(open);
  const openedRotationZ = useRef(0);
  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  useEffect(() => {
    phase.current = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2,
    };
  }, []);

  useEffect(() => {
    const lid = model.getObjectByName(REPAIR_CASE_LID_NODE_NAME);
    lidRef.current = lid ?? null;
    openedRotationZ.current = lid?.rotation.z ?? 0;

    if (lid) {
      lid.rotation.z =
        openedRotationZ.current +
        (initialOpen.current
          ? CASE_OPEN_ROTATION_OFFSET_Z
          : CASE_CLOSED_ROTATION_OFFSET_Z);
    }
  }, [model]);

  useEffect(() => {
    const lid = lidRef.current;
    if (!lid) return;

    const targetRotation =
      openedRotationZ.current +
      (open ? CASE_OPEN_ROTATION_OFFSET_Z : CASE_CLOSED_ROTATION_OFFSET_Z);
    gsap.to(lid.rotation, {
      z: targetRotation,
      duration: REPAIR_CASE_ANIMATION_DURATION,
      ease: "power2.inOut",
      overwrite: true,
    });

    return () => {
      gsap.killTweensOf(lid.rotation);
    };
  }, [open]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.getWorldPosition(worldPosition.current);
    const isNear =
      worldPosition.current.distanceTo(camera.position) <=
      REPAIR_CASE_FLOAT_ACTIVATION_DISTANCE;
    const targetHeight = isNear ? REPAIR_CASE_FLOAT_HEIGHT : 0;
    const floatSpeed = isNear
      ? REPAIR_CASE_FLOAT_UP_SPEED
      : REPAIR_CASE_FLOAT_DOWN_SPEED;

    floatHeight.current = THREE.MathUtils.damp(
      floatHeight.current,
      targetHeight,
      floatSpeed,
      delta,
    );
    group.position.y = position[1] + floatHeight.current;

    animationActiveRef.current = isNear;

    if (animationActiveRef.current) {
      const time = clock.elapsedTime;
      group.rotation.x =
        rotation[0] +
        Math.sin(time * 0.7 + phase.current.x) * ROTATION_AMPLITUDE;
      group.rotation.y =
        rotation[1] +
        Math.sin(time * 0.55 + phase.current.y) * ROTATION_AMPLITUDE;
      group.rotation.z =
        rotation[2] +
        Math.sin(time * 0.8 + phase.current.z) * ROTATION_AMPLITUDE;
      return;
    }

    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      rotation[0],
      REPAIR_CASE_ROTATION_RESET_SPEED,
      delta,
    );
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      rotation[1],
      REPAIR_CASE_ROTATION_RESET_SPEED,
      delta,
    );
    group.rotation.z = THREE.MathUtils.damp(
      group.rotation.z,
      rotation[2],
      REPAIR_CASE_ROTATION_RESET_SPEED,
      delta,
    );
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={parsedScale}
    >
      <primitive object={model} />
    </group>
  );
}
