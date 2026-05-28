import { Suspense, useCallback, useEffect, useRef } from "react";
import { Grid, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { EditorMap } from "@/components/editor/scene/EditorMap";
import { FlyController } from "@/controls/editor/FlyController";
import type {
  EditorCinematicPreviewRequest,
  MapNode,
  TransformMode,
  SceneData,
} from "@/types/editor/editor";

const EDITOR_CAMERA_HOME_POSITION = new THREE.Vector3(0, 50, 100);
const EDITOR_CAMERA_HOME_TARGET = new THREE.Vector3(0, 0, 0);

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

interface EditorSceneProps {
  sceneData: SceneData;
  selectedNodeIndex: number | null;
  selectedNodeIndexes: number[];
  onSelectNode: (index: number | null) => void;
  onToggleNodeSelection: (index: number) => void;
  isSelectionLocked: boolean;
  hoveredNodeIndex: number | null;
  onHoverNode: (index: number | null) => void;
  transformMode: TransformMode;
  snapToTerrain: boolean;
  lockTerrainSelection: boolean;
  onTransformModeChange: (mode: TransformMode) => void;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onNodeTransform: (nodeIndex: number, transform: MapNode) => void;
  snapAllToTerrainRequest: number;
  onSnapAllToTerrain: (mapNodes: MapNode[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  resetCameraRequest: number;
  focusSelectedCameraRequest: number;
  isPlayerMode?: boolean;
  cinematicPreviewRequest?: EditorCinematicPreviewRequest | null;
  onCinematicPreviewComplete?: (() => void) | undefined;
}

export function EditorScene({
  sceneData,
  selectedNodeIndex,
  selectedNodeIndexes,
  onSelectNode,
  onToggleNodeSelection,
  isSelectionLocked,
  hoveredNodeIndex,
  onHoverNode,
  transformMode,
  snapToTerrain,
  lockTerrainSelection,
  onTransformModeChange,
  onTransformStart,
  onTransformEnd,
  onNodeTransform,
  snapAllToTerrainRequest,
  onSnapAllToTerrain,
  onUndo,
  onRedo,
  resetCameraRequest,
  focusSelectedCameraRequest,
  isPlayerMode = false,
  cinematicPreviewRequest = null,
  onCinematicPreviewComplete,
}: EditorSceneProps): React.JSX.Element {
  const isCinematicPreviewing = cinematicPreviewRequest !== null;
  const camera = useThree((state) => state.camera);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  const previousSelectedNodeIndexRef = useRef<number | null>(null);

  const focusCameraOnNode = useCallback(
    (node: MapNode): void => {
      const controls = orbitControlsRef.current;
      const target = new THREE.Vector3(...node.position);
      const currentTarget = controls?.target ?? EDITOR_CAMERA_HOME_TARGET;
      const cameraOffset = camera.position.clone().sub(currentTarget);

      camera.position.copy(target).add(cameraOffset);
      camera.lookAt(target);
      controls?.target.copy(target);
      controls?.update();
    },
    [camera],
  );

  useEffect(() => {
    if (selectedNodeIndex === previousSelectedNodeIndexRef.current) return;
    previousSelectedNodeIndexRef.current = selectedNodeIndex;

    if (selectedNodeIndex === null || isPlayerMode || isCinematicPreviewing) {
      return;
    }

    const selectedNode = sceneData.mapNodes[selectedNodeIndex];
    if (!selectedNode) return;

    focusCameraOnNode(selectedNode);
  }, [
    camera,
    isCinematicPreviewing,
    isPlayerMode,
    focusCameraOnNode,
    sceneData,
    selectedNodeIndex,
  ]);

  useEffect(() => {
    if (
      focusSelectedCameraRequest === 0 ||
      selectedNodeIndex === null ||
      isPlayerMode ||
      isCinematicPreviewing
    ) {
      return;
    }

    const selectedNode = sceneData.mapNodes[selectedNodeIndex];
    if (!selectedNode) return;

    focusCameraOnNode(selectedNode);
  }, [
    focusSelectedCameraRequest,
    focusCameraOnNode,
    isCinematicPreviewing,
    isPlayerMode,
    sceneData,
    selectedNodeIndex,
  ]);

  useEffect(() => {
    if (resetCameraRequest === 0 || isPlayerMode || isCinematicPreviewing) {
      return;
    }

    const controls = orbitControlsRef.current;
    camera.position.copy(EDITOR_CAMERA_HOME_POSITION);
    camera.lookAt(EDITOR_CAMERA_HOME_TARGET);
    controls?.target.copy(EDITOR_CAMERA_HOME_TARGET);
    controls?.update();
  }, [camera, isCinematicPreviewing, isPlayerMode, resetCameraRequest]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableShortcutTarget(e.target)) return;

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
            if (!isSelectionLocked) onSelectNode(null);
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
  }, [
    isSelectionLocked,
    selectedNodeIndex,
    onSelectNode,
    onTransformModeChange,
    onUndo,
    onRedo,
  ]);

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
          ref={orbitControlsRef}
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

      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#242424"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a3a3a"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      <axesHelper args={[10]} />

      <Suspense fallback={null}>
        <EditorMap
          sceneData={sceneData}
          selectedNodeIndex={selectedNodeIndex}
          selectedNodeIndexes={selectedNodeIndexes}
          onSelectNode={onSelectNode}
          onToggleNodeSelection={onToggleNodeSelection}
          isSelectionLocked={isSelectionLocked}
          hoveredNodeIndex={hoveredNodeIndex}
          onHoverNode={onHoverNode}
          transformMode={transformMode}
          snapToTerrain={snapToTerrain}
          lockTerrainSelection={lockTerrainSelection}
          onTransformStart={onTransformStart}
          onTransformEnd={onTransformEnd}
          onNodeTransform={onNodeTransform}
          snapAllToTerrainRequest={snapAllToTerrainRequest}
          onSnapAllToTerrain={onSnapAllToTerrain}
        />
      </Suspense>

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
