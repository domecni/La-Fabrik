import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { EditorMap } from "@/components/editor/scene/EditorMap";
import { FlyController } from "@/controls/editor/FlyController";
import type { CinematicDefinition } from "@/types/cinematics/cinematics";
import type { MapNode, TransformMode, SceneData } from "@/types/editor/editor";

export interface EditorCinematicPreviewRequest {
  id: string;
  cinematic: CinematicDefinition;
}

interface EditorSceneProps {
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
  cinematicPreviewRequest?: EditorCinematicPreviewRequest | null;
  onCinematicPreviewComplete?: (() => void) | undefined;
}

export function EditorScene({
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
  cinematicPreviewRequest = null,
  onCinematicPreviewComplete,
}: EditorSceneProps): React.JSX.Element {
  const isCinematicPreviewing = cinematicPreviewRequest !== null;

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
      <EditorCinematicPreviewPlayer
        request={cinematicPreviewRequest}
        onComplete={onCinematicPreviewComplete}
      />

      {isPlayerMode ? (
        <FlyController disabled={isCinematicPreviewing} />
      ) : (
        <OrbitControls
          enabled={!isCinematicPreviewing}
          enableDamping
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2,
          }}
        />
      )}

      <EditorMap
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

interface EditorCinematicPreviewPlayerProps {
  request: EditorCinematicPreviewRequest | null;
  onComplete?: (() => void) | undefined;
}

function EditorCinematicPreviewPlayer({
  request,
  onComplete,
}: EditorCinematicPreviewPlayerProps): null {
  const camera = useThree((state) => state.camera);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;

    if (!request) return undefined;

    const firstKeyframe = request.cinematic.cameraKeyframes[0];
    if (!firstKeyframe) return undefined;

    const target = new THREE.Vector3(...firstKeyframe.target);
    camera.position.set(...firstKeyframe.position);
    camera.lookAt(target);

    const timeline = gsap.timeline({
      onUpdate: () => camera.lookAt(target),
      onComplete: () => {
        timelineRef.current = null;
        onComplete?.();
      },
    });

    request.cinematic.cameraKeyframes.slice(1).forEach((keyframe, index) => {
      const previousKeyframe = request.cinematic.cameraKeyframes[index];
      if (!previousKeyframe) return;

      const duration = keyframe.time - previousKeyframe.time;
      timeline.to(
        camera.position,
        {
          x: keyframe.position[0],
          y: keyframe.position[1],
          z: keyframe.position[2],
          duration,
          ease: "power2.inOut",
        },
        previousKeyframe.time,
      );
      timeline.to(
        target,
        {
          x: keyframe.target[0],
          y: keyframe.target[1],
          z: keyframe.target[2],
          duration,
          ease: "power2.inOut",
        },
        previousKeyframe.time,
      );
    });

    timelineRef.current = timeline;

    return () => {
      timeline.kill();
      if (timelineRef.current === timeline) timelineRef.current = null;
    };
  }, [camera, onComplete, request]);

  return null;
}
