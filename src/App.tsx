import { Routes, Route } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Crosshair } from "@/components/ui/Crosshair";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { DebugPerf } from "@/utils/debug/DebugPerf";
import { World } from "@/world/World";
import { EditorPage } from "@/components/editor/EditorPage";

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Canvas camera={{ position: [85, 60, 85], fov: 42 }} shadows>
              <World />
              <DebugPerf />
            </Canvas>
            <Crosshair />
            <InteractPrompt />
          </>
        }
      />
      <Route path="/editor" element={<EditorPage />} />
    </Routes>
  );
}

export default App;
