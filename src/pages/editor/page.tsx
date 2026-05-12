import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { EditorControls } from "@/components/editor/EditorControls";
import { EditorScene } from "@/components/editor/scene/EditorScene";
import type { EditorCinematicPreviewRequest } from "@/components/editor/scene/EditorScene";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { Subtitles } from "@/components/ui/Subtitles";
import { useEditorHistory } from "@/hooks/editor/useEditorHistory";
import type { CinematicDefinition } from "@/types/cinematics/cinematics";
import { useEditorSceneData } from "@/hooks/editor/useEditorSceneData";
import type { MapNode, SceneData, TransformMode } from "@/types/editor/editor";
import {
  INITIAL_SCENE_LOADING_STATE,
  type SceneLoadingChangeHandler,
  type SceneLoadingState,
} from "@/types/world/sceneLoading";

const SAVE_ERROR_MESSAGE = "Erreur lors de l'enregistrement";

interface EditorSceneLoadingTrackerProps {
  onLoadingStateChange: SceneLoadingChangeHandler;
}

function serializeMapNodes(sceneData: SceneData): string {
  return JSON.stringify(sceneData.mapNodes, null, 2);
}

function EditorSceneLoadingTracker({
  onLoadingStateChange,
}: EditorSceneLoadingTrackerProps): null {
  const { active, progress } = useProgress();

  useEffect(() => {
    if (active) {
      onLoadingStateChange({
        currentStep: "Importation des models",
        progress: 0.2 + (progress / 100) * 0.7,
        status: "loading",
      });
      return;
    }

    onLoadingStateChange({
      currentStep: "Gameplay prêt",
      progress: 1,
      status: "ready",
    });
  }, [active, onLoadingStateChange, progress]);

  return null;
}

export function EditorPage(): React.JSX.Element {
  const {
    hasMapJson,
    isMapLoading,
    sceneData,
    setSceneData,
    handleFolderUpload,
  } = useEditorSceneData();

  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(
    null,
  );
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");
  const [isPlayerMode, setIsPlayerMode] = useState(false);
  const [isSelectionLocked, setIsSelectionLocked] = useState(false);
  const [sceneLoadingState, setSceneLoadingState] = useState<SceneLoadingState>(
    {
      ...INITIAL_SCENE_LOADING_STATE,
      currentStep: "Montage progressif des models",
      progress: 0.2,
    },
  );
  const handleSceneLoadingStateChange = useCallback(
    (nextState: SceneLoadingState) => {
      setSceneLoadingState((currentState) => {
        const shouldRestartProgress = currentState.status === "ready";

        return {
          ...nextState,
          progress: shouldRestartProgress
            ? nextState.progress
            : Math.max(currentState.progress, nextState.progress),
        };
      });
    },
    [],
  );
  const editorLoadingState = isMapLoading
    ? {
        currentStep: "Récupération blocking",
        progress: 0.08,
        status: "loading" as const,
      }
    : sceneLoadingState;
  const [cinematicPreviewRequest, setCinematicPreviewRequest] =
    useState<EditorCinematicPreviewRequest | null>(null);

  const {
    undoCount,
    redoCount,
    handleUndo,
    handleRedo,
    handleTransformStart,
    handleTransformEnd,
  } = useEditorHistory(sceneData, setSceneData);

  const handleSelectNode = useCallback((index: number | null) => {
    setSelectedNodeIndex(index);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedNodeIndex(null);
  }, []);

  const handleSelectionLockToggle = useCallback(() => {
    setIsSelectionLocked((locked) => !locked);
  }, []);

  const handleHoverNode = useCallback((index: number | null) => {
    setHoveredNodeIndex(index);
  }, []);

  const handleTransformModeChange = useCallback((mode: TransformMode) => {
    setTransformMode(mode);
  }, []);

  const handleSaveToServer = useCallback(async () => {
    if (!sceneData) return;
    const json = serializeMapNodes(sceneData);

    try {
      const response = await fetch("/api/save-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });

      if (response.ok) {
        alert("Map enregistrée avec succès!");
      } else {
        alert(SAVE_ERROR_MESSAGE);
      }
    } catch (err) {
      console.error("Error saving map:", err);
      alert(SAVE_ERROR_MESSAGE);
    }
  }, [sceneData]);

  const handleExportJson = useCallback(() => {
    if (!sceneData) return;
    const json = serializeMapNodes(sceneData);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [sceneData]);

  const handlePlayerMode = useCallback(() => {
    setIsPlayerMode((prev) => !prev);
  }, []);

  const handlePreviewCinematic = useCallback(
    (cinematic: CinematicDefinition) => {
      setCinematicPreviewRequest({
        id: window.crypto.randomUUID(),
        cinematic,
      });
    },
    [],
  );

  const handleCinematicPreviewComplete = useCallback(() => {
    setCinematicPreviewRequest(null);
  }, []);

  const handleNodeTransform = useCallback(
    (nodeIndex: number, updatedNode: MapNode) => {
      setSceneData((prev) => {
        if (!prev) return null;
        const newMapNodes = [...prev.mapNodes];
        newMapNodes[nodeIndex] = updatedNode;
        return { ...prev, mapNodes: newMapNodes };
      });
    },
    [setSceneData],
  );

  if (isMapLoading) {
    return (
      <div className="editor-container">
        <SceneLoadingOverlay state={editorLoadingState} />
      </div>
    );
  }

  if (!hasMapJson) {
    return (
      <div className="editor-container">
        <div className="editor-error">
          <h2>Erreur : map.json introuvable</h2>
          <p>
            Le fichier map.json est requis dans le dossier <code>public/</code>.
          </p>

          <div className="editor-upload-section">
            <h3>Télécharger un dossier contenant map.json</h3>

            <label className="editor-drop-zone">
              <input
                type="file"
                className="editor-folder-input"
                onChange={handleFolderUpload}
                multiple
                {...{ webkitdirectory: "" }}
              />
              Choisir un dossier contenant map.json
            </label>

            <div className="editor-folder-structure">
              <h4>Structure requise :</h4>
              <pre>
                public/ ├── <strong>map.json</strong> (à la racine) └── models/
                ├── arbre/ │ └── model.glb ├── building/ │ └── model.gltf └──
                ...
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <Canvas
        camera={{ position: [0, 50, 100], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050505");
        }}
      >
        <EditorSceneLoadingTracker
          onLoadingStateChange={handleSceneLoadingStateChange}
        />
        <Suspense fallback={null}>
          <EditorScene
            sceneData={sceneData!}
            selectedNodeIndex={selectedNodeIndex}
            onSelectNode={handleSelectNode}
            isSelectionLocked={isSelectionLocked}
            hoveredNodeIndex={hoveredNodeIndex}
            onHoverNode={handleHoverNode}
            transformMode={transformMode}
            onTransformModeChange={handleTransformModeChange}
            onTransformStart={handleTransformStart}
            onTransformEnd={handleTransformEnd}
            onNodeTransform={handleNodeTransform}
            onUndo={handleUndo}
            onRedo={handleRedo}
            isPlayerMode={isPlayerMode}
            cinematicPreviewRequest={cinematicPreviewRequest}
            onCinematicPreviewComplete={handleCinematicPreviewComplete}
          />
        </Suspense>
      </Canvas>

      <SceneLoadingOverlay state={editorLoadingState} />

      {sceneData && (
        <EditorControls
          transformMode={transformMode}
          onTransformModeChange={handleTransformModeChange}
          selectedNodeIndex={selectedNodeIndex}
          mapNodes={sceneData.mapNodes}
          nodesCount={sceneData.mapNodes.length}
          selectedNodeName={
            selectedNodeIndex !== null && sceneData.mapNodes[selectedNodeIndex]
              ? sceneData.mapNodes[selectedNodeIndex].name || null
              : null
          }
          isSelectionLocked={isSelectionLocked}
          onSelectionLockToggle={handleSelectionLockToggle}
          onClearSelection={handleClearSelection}
          undoCount={undoCount}
          redoCount={redoCount}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportJson={handleExportJson}
          onSaveToServer={import.meta.env.DEV ? handleSaveToServer : undefined}
          onPlayerMode={handlePlayerMode}
          onPreviewCinematic={handlePreviewCinematic}
          isPlayerMode={isPlayerMode}
        />
      )}
      <Subtitles />
    </div>
  );
}
