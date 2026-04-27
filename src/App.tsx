import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Crosshair } from "@/components/ui/Crosshair";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { DebugPerf } from "@/utils/debug/DebugPerf";
import { World } from "@/world/World";

function App(): React.JSX.Element {
  return (
    <>
      <Canvas camera={{ position: [85, 60, 85], fov: 42 }} shadows>
        <Suspense fallback={null}>
          <World />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <Crosshair />
      <InteractPrompt />
    </>
  );
}

export default App;
