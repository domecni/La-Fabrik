import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Crosshair } from "@/components/ui/Crosshair";
import { HandTrackingOverlay } from "@/components/ui/HandTrackingOverlay";
import { HandTrackingProvider } from "@/providers/gameplay/HandTrackingProvider";
import { HandTrackingVisualizer } from "@/components/ui/HandTrackingVisualizer";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { DebugPerf } from "@/components/debug/DebugPerf";
import { World } from "@/world/World";

export function HomePage(): React.JSX.Element {
  return (
    <HandTrackingProvider>
      <Canvas camera={{ position: [85, 60, 85], fov: 42 }} shadows>
        <Suspense fallback={null}>
          <World />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <Crosshair />
      <InteractPrompt />
      <HandTrackingVisualizer />
      <HandTrackingOverlay />
    </HandTrackingProvider>
  );
}
