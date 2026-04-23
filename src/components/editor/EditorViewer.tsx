import { useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import EditorCamera from "./EditorCamera";
import FlyController from "./FlyController";
import MapViewer from "./MapViewer";
import type { MapNode, TransformMode } from "./types";
import type { SceneData } from "./types";

interface EditorViewerProps {
  sceneData: SceneData;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  hoveredNodeIndex: number | null;
  onHoverNode: (index: number | null) => void;
  transformMode: TransformMode;
  onTransformModeChange: (mode: TransformMode) => void;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onNodeTransform: (nodeIndex: number, transform: MapNode) => void;
  onUndo: () => void;
  onRedo: () => void;
  isPlayerMode?: boolean;
}

export default function EditorViewer({
  sceneData,
  selectedNodeIndex,
  onSelectNode,
  hoveredNodeIndex,
  onHoverNode,
  transformMode,
  onTransformModeChange,
  onTransformStart,
  onTransformEnd,
  onNodeTransform,
  onUndo,
  onRedo,
  isPlayerMode = false,
}: EditorViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          onUndo();
          return;
        }
        if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          onRedo();
          return;
        }
      }

      if (selectedNodeIndex !== null) {
        switch (e.key.toLowerCase()) {
          case "escape":
            onSelectNode(null);
            break;
          case "t":
            onTransformModeChange("translate");
            break;
          case "r":
            onTransformModeChange("rotate");
            break;
          case "s":
            onTransformModeChange("scale");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIndex, onSelectNode, onTransformModeChange, onUndo, onRedo]);

  return (
    <>
      <EditorCamera />

      {isPlayerMode ? (
        <FlyController disabled={false} />
      ) : (
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2,
          }}
        />
      )}

      <MapViewer
        sceneData={sceneData}
        selectedNodeIndex={selectedNodeIndex}
        onSelectNode={onSelectNode}
        hoveredNodeIndex={hoveredNodeIndex}
        onHoverNode={onHoverNode}
        transformMode={transformMode}
        onTransformStart={onTransformStart}
        onTransformEnd={onTransformEnd}
        onNodeTransform={onNodeTransform}
      />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />
    </>
  );
}
