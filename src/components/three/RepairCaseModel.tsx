import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types/three";

interface RepairCaseModelProps {
  modelPath: string;
  open: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number | Vector3Tuple;
}

const CASE_LID_NODE_NAME = "partiesup";
const CASE_CLOSED_ROTATION_OFFSET_Z = 0;
const CASE_OPEN_ROTATION_OFFSET_Z = THREE.MathUtils.degToRad(115);
const CASE_ANIMATION_DURATION = 0.8;

export function RepairCaseModel({
  modelPath,
  open,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RepairCaseModelProps): React.JSX.Element {
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);
  const lidRef = useRef<THREE.Object3D | null>(null);
  const initialOpen = useRef(open);
  const openedRotationZ = useRef(0);
  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  useEffect(() => {
    const lid = model.getObjectByName(CASE_LID_NODE_NAME);
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
      duration: CASE_ANIMATION_DURATION,
      ease: "power2.inOut",
      overwrite: true,
    });

    return () => {
      gsap.killTweensOf(lid.rotation);
    };
  }, [open]);

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      <primitive object={model} />
    </group>
  );
}
