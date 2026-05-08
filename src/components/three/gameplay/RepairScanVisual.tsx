import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";

interface RepairScanVisualProps {
  config: RepairMissionConfig;
}

export function RepairScanVisual({
  config,
}: RepairScanVisualProps): React.JSX.Element {
  const scanLineRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const scanLine = scanLineRef.current;
    if (!scanLine) return;

    scanLine.position.y = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.7;
  });

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.035, 12, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} />
      </mesh>
      <mesh ref={scanLineRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 1.25, 96]} />
        <meshBasicMaterial
          color="#7dd3fc"
          side={THREE.DoubleSide}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[1.25, 32, 16]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} />
      </mesh>
      <RepairPromptVideo src={config.brokenUiPath} position={[0, 2.3, 0]} />
    </group>
  );
}
