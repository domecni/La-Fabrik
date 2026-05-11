import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLES = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2;
  const ring = index % 3;
  return {
    angle,
    radius: 0.45 + ring * 0.28,
    y: 0.35 + (index % 5) * 0.16,
    speed: 0.8 + (index % 4) * 0.18,
  };
});

export function RepairCompletionParticles(): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y = clock.elapsedTime * 0.9;
    group.children.forEach((child, index) => {
      const particle = PARTICLES[index];
      if (!particle) return;

      const pulse = 1 + Math.sin(clock.elapsedTime * 5 + index) * 0.35;
      child.position.y =
        particle.y + Math.sin(clock.elapsedTime * particle.speed) * 0.08;
      child.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={groupRef}>
      {PARTICLES.map((particle, index) => (
        <mesh
          key={index}
          position={[
            Math.cos(particle.angle) * particle.radius,
            particle.y,
            Math.sin(particle.angle) * particle.radius,
          ]}
        >
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#86efac" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}
