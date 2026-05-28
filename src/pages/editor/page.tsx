import { useCallback, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { EditorControls } from "@/components/editor/EditorControls";
import { EditorScene } from "@/components/editor/scene/EditorScene";
import type { EditorCinematicPreviewRequest } from "@/components/editor/scene/EditorScene";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { Subtitles } from "@/components/ui/Subtitles";
import { useEditorHistory } from "@/hooks/editor/useEditorHistory";
import type { CinematicDefinition } from "@/types/cinematics/cinematics";
import { useEditorSceneData } from "@/hooks/editor/useEditorSceneData";
import type { MapNode, TransformMode } from "@/types/editor/editor";
import type { SceneLoadingState } from "@/types/world/sceneLoading";
import { logger } from "@/utils/core/Logger";
import {
  addTreeNode,
  createNewMapNode,
  mergeFlatNodeTransformsIntoTree,
  removeEditorMetadata,
  removeTreeNodeAtPath,
  serializeMapNodes,
  updateSceneDataTree,
  updateTreeNodeAtPath,
} from "@/utils/editor/editorMapTree";

const SAVE_ERROR_MESSAGE = "Erreur lors de l'enregistrement";
const DEFAULT_NEW_NODE_NAME = "new-model";

function EditorWebGLContextLogger(): null {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.setClearColor("#050505");

    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      logger.error("WebGL", "Context lost - GPU resources exhausted");
    };
    const handleContextRestored = () => {
      logger.info("WebGL", "Context restored");
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl]);

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
  const [selectedNodeIndexes, setSelectedNodeIndexes] = useState<number[]>([]);
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");
  const [isPlayerMode, setIsPlayerMode] = useState(false);
  const [isSelectionLocked, setIsSelectionLocked] = useState(false);
  const [snapToTerrain, setSnapToTerrain] = useState(true);
  const [newNodeName, setNewNodeName] = useState(DEFAULT_NEW_NODE_NAME);
  const [lockTerrainSelection, setLockTerrainSelection] = useState(true);
  const [resetCameraRequest, setResetCameraRequest] = useState(0);
  const [snapAllToTerrainRequest, setSnapAllToTerrainRequest] = useState(0);
  const [focusSelectedCameraRequest, setFocusSelectedCameraRequest] =
    useState(0);
  const [cameraViewMode, setCameraViewMode] = useState<"home" | "object">(
    "home",
  );
  const editorLoadingState: SceneLoadingState = isMapLoading
    ? {
        currentStep: "Récupération blocking",
        progress: 0.08,
        status: "loading" as const,
      }
    : {
        currentStep: "Gameplay prêt",
        progress: 1,
        status: "ready" as const,
      };
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
    setSelectedNodeIndexes(index === null ? [] : [index]);

    if (index !== null) {
      setCameraViewMode("object");
      return;
    }

    setCameraViewMode("home");
    setResetCameraRequest((request) => request + 1);
  }, []);

  const handleToggleNodeSelection = useCallback(
    (index: number) => {
      const isSelected = selectedNodeIndexes.includes(index);
      const nextIndexes = isSelected
        ? selectedNodeIndexes.filter((item) => item !== index)
        : [...selectedNodeIndexes, index];

      setSelectedNodeIndexes(nextIndexes);
      setSelectedNodeIndex(nextIndexes.at(-1) ?? null);
      if (nextIndexes.length > 0) {
        setCameraViewMode("object");
      } else {
        setCameraViewMode("home");
        setResetCameraRequest((request) => request + 1);
      }
    },
    [selectedNodeIndexes],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedNodeIndex(null);
    setSelectedNodeIndexes([]);
    setCameraViewMode("home");
    setResetCameraRequest((request) => request + 1);
  }, []);

  const handleSelectionLockToggle = useCallback(() => {
    setIsSelectionLocked((locked) => !locked);
  }, []);

  const handleSnapToTerrainToggle = useCallback(() => {
    setSnapToTerrain((enabled) => !enabled);
  }, []);

  const handleSnapAllToTerrainRequest = useCallback(() => {
    setSnapAllToTerrainRequest((request) => request + 1);
  }, []);

  const handleSnapAllToTerrain = useCallback(
    (mapNodes: MapNode[]) => {
      setSceneData((prev) => {
        if (!prev) return null;

        const nextSceneData = { ...prev, mapNodes };
        if (!prev.mapTree) return nextSceneData;

        const mapTree = mergeFlatNodeTransformsIntoTree(nextSceneData);
        return updateSceneDataTree(nextSceneData, mapTree);
      });
    },
    [setSceneData],
  );

  const handleNewNodeNameChange = useCallback((value: string) => {
    setNewNodeName(value);
  }, []);

  const handleTerrainSelectionLockChange = useCallback(
    (locked: boolean) => {
      setLockTerrainSelection(locked);

      if (!locked) return;

      const nextIndexes = selectedNodeIndexes.filter(
        (index) => sceneData?.mapNodes[index]?.name !== "terrain",
      );
      const selectedNode =
        selectedNodeIndex !== null
          ? sceneData?.mapNodes[selectedNodeIndex]
          : null;

      setSelectedNodeIndexes(nextIndexes);
      setSelectedNodeIndex(
        selectedNode?.name === "terrain" ? null : selectedNodeIndex,
      );
    },
    [sceneData, selectedNodeIndex, selectedNodeIndexes],
  );

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

  const handleCameraAction = useCallback(() => {
    if (selectedNodeIndex !== null && cameraViewMode === "home") {
      setFocusSelectedCameraRequest((request) => request + 1);
      setCameraViewMode("object");
      return;
    }

    setResetCameraRequest((request) => request + 1);
    setCameraViewMode("home");
  }, [cameraViewMode, selectedNodeIndex]);

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
        const currentNode = prev.mapNodes[nodeIndex];
        if (!currentNode) return prev;

        if (!prev.mapTree || !currentNode.sourcePath) {
          const mapNodes = [...prev.mapNodes];
          mapNodes[nodeIndex] = updatedNode;
          return { ...prev, mapNodes };
        }

        const mapTree = updateTreeNodeAtPath(
          prev.mapTree,
          currentNode.sourcePath,
          (node) => ({
            ...node,
            position: updatedNode.position,
            rotation: updatedNode.rotation,
            scale: updatedNode.scale,
          }),
        );
        return updateSceneDataTree(prev, mapTree);
      });
    },
    [setSceneData],
  );

  const handleSelectedScaleChange = useCallback(
    (axis: 0 | 1 | 2, value: number) => {
      if (selectedNodeIndex === null || Number.isNaN(value)) return;

      setSceneData((prev) => {
        if (!prev) return null;
        const currentNode = prev.mapNodes[selectedNodeIndex];
        if (!currentNode) return prev;

        const nextScale = [...currentNode.scale] as [number, number, number];
        nextScale[axis] = value;

        if (!prev.mapTree || !currentNode.sourcePath) {
          const mapNodes = [...prev.mapNodes];
          mapNodes[selectedNodeIndex] = { ...currentNode, scale: nextScale };
          return { ...prev, mapNodes };
        }

        const mapTree = updateTreeNodeAtPath(
          prev.mapTree,
          currentNode.sourcePath,
          (node) => ({ ...node, scale: nextScale }),
        );

        return updateSceneDataTree(prev, mapTree);
      });
    },
    [selectedNodeIndex, setSceneData],
  );

  const handleAddNode = useCallback(() => {
    if (!sceneData) return;

    if (!sceneData.mapTree) {
      const newNode = createNewMapNode(newNodeName);
      const mapNodes = [...sceneData.mapNodes, removeEditorMetadata(newNode)];
      const selectedIndex = mapNodes.length - 1;

      setSceneData({ ...sceneData, mapNodes });
      setSelectedNodeIndex(selectedIndex);
      setSelectedNodeIndexes([selectedIndex]);
      return;
    }

    const mapTree = addTreeNode(
      sceneData.mapTree,
      createNewMapNode(newNodeName),
    );
    const nextSceneData = updateSceneDataTree(sceneData, mapTree);
    const selectedIndex = nextSceneData.mapNodes.length - 1;

    setSceneData(nextSceneData);
    setSelectedNodeIndex(selectedIndex);
    setSelectedNodeIndexes([selectedIndex]);
  }, [newNodeName, sceneData, setSceneData]);

  const handleDeleteSelectedNode = useCallback(() => {
    if (!sceneData || selectedNodeIndex === null) return;

    const currentNode = sceneData.mapNodes[selectedNodeIndex];
    if (!currentNode) return;

    if (!sceneData.mapTree || !currentNode.sourcePath) {
      setSceneData({
        ...sceneData,
        mapNodes: sceneData.mapNodes.filter(
          (_node, index) => index !== selectedNodeIndex,
        ),
      });
    } else {
      const mapTree = removeTreeNodeAtPath(
        sceneData.mapTree,
        currentNode.sourcePath,
      );
      setSceneData(updateSceneDataTree(sceneData, mapTree));
    }

    setSelectedNodeIndex(null);
    setSelectedNodeIndexes([]);
  }, [sceneData, selectedNodeIndex, setSceneData]);

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
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
        }}
      >
        <EditorWebGLContextLogger />
        <EditorScene
          sceneData={sceneData!}
          selectedNodeIndex={selectedNodeIndex}
          selectedNodeIndexes={selectedNodeIndexes}
          onSelectNode={handleSelectNode}
          onToggleNodeSelection={handleToggleNodeSelection}
          isSelectionLocked={isSelectionLocked}
          hoveredNodeIndex={hoveredNodeIndex}
          onHoverNode={handleHoverNode}
          transformMode={transformMode}
          snapToTerrain={snapToTerrain}
          lockTerrainSelection={lockTerrainSelection}
          onTransformModeChange={handleTransformModeChange}
          onTransformStart={handleTransformStart}
          onTransformEnd={handleTransformEnd}
          onNodeTransform={handleNodeTransform}
          snapAllToTerrainRequest={snapAllToTerrainRequest}
          onSnapAllToTerrain={handleSnapAllToTerrain}
          onUndo={handleUndo}
          onRedo={handleRedo}
          resetCameraRequest={resetCameraRequest}
          focusSelectedCameraRequest={focusSelectedCameraRequest}
          isPlayerMode={isPlayerMode}
          cinematicPreviewRequest={cinematicPreviewRequest}
          onCinematicPreviewComplete={handleCinematicPreviewComplete}
        />
      </Canvas>

      <SceneLoadingOverlay state={editorLoadingState} />

      {sceneData && (
        <EditorControls
          transformMode={transformMode}
          onTransformModeChange={handleTransformModeChange}
          selectedNodeIndex={selectedNodeIndex}
          selectedNodeIndexes={selectedNodeIndexes}
          mapNodes={sceneData.mapNodes}
          nodesCount={sceneData.mapNodes.length}
          selectedNodeName={
            selectedNodeIndex !== null && sceneData.mapNodes[selectedNodeIndex]
              ? sceneData.mapNodes[selectedNodeIndex].name || null
              : null
          }
          selectedNodeScale={
            selectedNodeIndex !== null && sceneData.mapNodes[selectedNodeIndex]
              ? sceneData.mapNodes[selectedNodeIndex].scale
              : null
          }
          lockTerrainSelection={lockTerrainSelection}
          onLockTerrainSelectionChange={handleTerrainSelectionLockChange}
          isSelectionLocked={isSelectionLocked}
          onSelectionLockToggle={handleSelectionLockToggle}
          onClearSelection={handleClearSelection}
          snapToTerrain={snapToTerrain}
          onSnapToTerrainToggle={handleSnapToTerrainToggle}
          onSnapAllToTerrain={handleSnapAllToTerrainRequest}
          newNodeName={newNodeName}
          onNewNodeNameChange={handleNewNodeNameChange}
          onAddNode={handleAddNode}
          onDeleteSelectedNode={handleDeleteSelectedNode}
          onSelectedScaleChange={handleSelectedScaleChange}
          undoCount={undoCount}
          redoCount={redoCount}
          onUndo={handleUndo}
          onRedo={handleRedo}
          cameraActionLabel={
            selectedNodeIndex !== null && cameraViewMode === "home"
              ? "Center on object"
              : "Reset camera"
          }
          onCameraAction={handleCameraAction}
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
