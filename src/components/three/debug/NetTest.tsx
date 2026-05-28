import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createNetShader } from "@/shaders/NetShader";

export function NetTest(): React.JSX.Element {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((_, delta) => {
    const timeUniform = materialRef.current?.uniforms.uTime;
    if (timeUniform) timeUniform.value += delta;
  });

  return (
    <mesh position={[0, 2, -3]} rotation={[0, 0, 0]}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <primitive
        object={createNetShader()}
        ref={materialRef}
        attach="material"
      />
    </mesh>
  );
}
