import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DebugPerf } from "@/components/debug/DebugPerf";
import { GameUI } from "@/components/ui/GameUI";
import { HandTrackingProvider } from "@/providers/gameplay/HandTrackingProvider";
import { World } from "@/world/World";

export function HomePage(): React.JSX.Element {
  return (
    <HandTrackingProvider>
      <Canvas
        camera={{ position: [85, 60, 85], fov: 42 }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <Suspense fallback={null}>
          <World />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <GameUI />
    </HandTrackingProvider>
  );
}
