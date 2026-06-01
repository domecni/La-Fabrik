import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import type { Vector3Tuple } from "@/types/three/three";

const TALKIE_MODEL_PATH = "/models/talkie/model.gltf";
const TALKIE_REST_Y = -1.55;
const TALKIE_ACTIVE_Y = -0.38;
const TALKIE_BASE_ROTATION: Vector3Tuple = [0.08, -0.52, -0.04];
const TALKIE_FLOAT_ROTATION_AMPLITUDE = THREE.MathUtils.degToRad(2.2);
const TALKIE_FLOAT_Y_AMPLITUDE = 0.055;

interface TalkieModelProps {
  active: boolean;
}

export function TalkieModel({ active }: TalkieModelProps): React.JSX.Element {
  const { scene } = useGLTF(TALKIE_MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;
      }
    });
  }, [model]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    gsap.killTweensOf(group.position);
    gsap.to(group.position, {
      y: active ? TALKIE_ACTIVE_Y : TALKIE_REST_Y,
      duration: active ? 0.72 : 0.5,
      ease: active ? "power3.out" : "power2.out",
    });

    return () => {
      gsap.killTweensOf(group.position);
    };
  }, [active]);

  useFrame(({ clock }) => {
    if (!floatRef.current) return;

    const t = clock.getElapsedTime();
    floatRef.current.position.y = Math.sin(t * 1.2) * TALKIE_FLOAT_Y_AMPLITUDE;

    floatRef.current.rotation.x =
      TALKIE_BASE_ROTATION[0] +
      Math.sin(t * 0.7) * TALKIE_FLOAT_ROTATION_AMPLITUDE;
    floatRef.current.rotation.y =
      TALKIE_BASE_ROTATION[1] +
      Math.sin(t * 0.55) * TALKIE_FLOAT_ROTATION_AMPLITUDE;
    floatRef.current.rotation.z =
      TALKIE_BASE_ROTATION[2] +
      Math.sin(t * 0.8) * TALKIE_FLOAT_ROTATION_AMPLITUDE;
  });

  return (
    <group ref={groupRef} position={[0, TALKIE_REST_Y, 0]}>
      <group ref={floatRef} rotation={TALKIE_BASE_ROTATION}>
        <primitive
          object={model}
          position={[0, -2.45, 0]}
          rotation={[0, -1, 0]}
          scale={1.2}
        />
      </group>
    </group>
  );
}

useGLTF.preload(TALKIE_MODEL_PATH);
