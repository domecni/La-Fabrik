import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EditorControls } from "@/components/editor/EditorControls";
import { EditorScene } from "@/components/editor/scene/EditorScene";
import type { EditorCinematicPreviewRequest } from "@/components/editor/scene/EditorScene";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { Subtitles } from "@/components/ui/Subtitles";
import { useEditorHistory } from "@/hooks/editor/useEditorHistory";
import type { CinematicDefinition } from "@/types/cinematics/cinematics";
import { useEditorSceneData } from "@/hooks/editor/useEditorSceneData";
import type {
  HierarchicalMapNode,
  MapNode,
  SceneData,
  TransformMode,
} from "@/types/editor/editor";
import type { SceneLoadingState } from "@/types/world/sceneLoading";
import { logger } from "@/utils/core/Logger";

const SAVE_ERROR_MESSAGE = "Erreur lors de l'enregistrement";
const DEFAULT_NEW_NODE_NAME = "new-model";

function serializeMapNodes(sceneData: SceneData): string {
  const mapPayload = sceneData.mapTree
    ? mergeFlatNodeTransformsIntoTree(sceneData)
    : sceneData.mapNodes.map(removeEditorMetadata);

  return JSON.stringify(mapPayload, null, 2);
}

function createSourcePathKey(sourcePath: readonly number[]): string {
  return sourcePath.join(".");
}

function removeEditorMetadata(node: MapNode): MapNode {
  return {
    ...(node.id ? { id: node.id } : {}),
    name: node.name,
    type: node.type,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

function mergeFlatNodeTransformsIntoTree(
  sceneData: SceneData,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nodesBySourcePath = new Map<string, MapNode>();

  for (const node of sceneData.mapNodes) {
    if (!node.sourcePath) continue;
    nodesBySourcePath.set(createSourcePathKey(node.sourcePath), node);
  }

  const cloneNode = (
    node: HierarchicalMapNode,
    path: number[],
  ): HierarchicalMapNode => {
    const updatedNode = nodesBySourcePath.get(createSourcePathKey(path));
    const nextNode: HierarchicalMapNode = {
      ...((updatedNode?.id ?? node.id)
        ? { id: updatedNode?.id ?? node.id }
        : {}),
      name: node.name,
      type: node.type,
      position: updatedNode?.position ?? node.position,
      rotation: updatedNode?.rotation ?? node.rotation,
      scale: updatedNode?.scale ?? node.scale,
    };

    if (node.role) {
      nextNode.role = node.role;
    }

    if (node.children) {
      nextNode.children = node.children.map((child, index) =>
        cloneNode(child, [...path, index]),
      );
    }

    return nextNode;
  };

  const mapTree = sceneData.mapTree;

  if (!mapTree) {
    return sceneData.mapNodes.map(removeEditorMetadata);
  }

  if (Array.isArray(mapTree)) {
    return mapTree.map((node, index) => cloneNode(node, [index]));
  }

  return cloneNode(mapTree, []);
}

function cloneMapTree(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  return JSON.parse(JSON.stringify(mapTree)) as
    | HierarchicalMapNode
    | HierarchicalMapNode[];
}

function collectEditableMapNodes(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): MapNode[] {
  const nodes: MapNode[] = [];

  function visit(node: HierarchicalMapNode, path: number[]): void {
    if (node.role !== "group" && node.type !== "Mesh") {
      nodes.push({
        ...(node.id ? { id: node.id } : {}),
        name: node.name,
        position: node.position,
        rotation: node.rotation,
        scale: node.scale,
        sourcePath: path,
        type: node.type,
      });
    }

    node.children?.forEach((child, index) => visit(child, [...path, index]));
  }

  if (Array.isArray(mapTree)) {
    mapTree.forEach((node, index) => visit(node, [index]));
  } else {
    visit(mapTree, []);
  }

  return nodes;
}

function updateTreeNodeAtPath(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  path: number[],
  update: (node: HierarchicalMapNode) => HierarchicalMapNode,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const rootNodes = Array.isArray(nextTree) ? nextTree : [nextTree];
  const targetIndex = path[path.length - 1] ?? 0;
  const isRootTarget = Array.isArray(nextTree)
    ? path.length === 1
    : path.length === 0;

  if (isRootTarget) {
    const targetNode = rootNodes[targetIndex];
    if (targetNode) {
      rootNodes[targetIndex] = update(targetNode);
    }
    return nextTree;
  }

  const parentPath = path.slice(0, -1);
  let parent = Array.isArray(nextTree)
    ? rootNodes[parentPath[0] ?? 0]
    : rootNodes[0];
  const childPath = Array.isArray(nextTree) ? parentPath.slice(1) : parentPath;

  for (const index of childPath) {
    parent = parent?.children?.[index];
  }

  if (!parent?.children?.[targetIndex]) return nextTree;
  parent.children[targetIndex] = update(parent.children[targetIndex]);

  return nextTree;
}

function removeTreeNodeAtPath(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  path: number[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const rootNodes = Array.isArray(nextTree) ? nextTree : [nextTree];
  const targetIndex = path[path.length - 1];
  if (targetIndex === undefined) return nextTree;

  if (Array.isArray(nextTree) && path.length === 1) {
    nextTree.splice(targetIndex, 1);
    return nextTree;
  }

  const parentPath = path.slice(0, -1);
  let parent = Array.isArray(nextTree)
    ? rootNodes[parentPath[0] ?? 0]
    : rootNodes[0];
  const childPath = Array.isArray(nextTree) ? parentPath.slice(1) : parentPath;

  for (const index of childPath) {
    parent = parent?.children?.[index];
  }

  parent?.children?.splice(targetIndex, 1);
  return nextTree;
}

function updateSceneDataTree(
  sceneData: SceneData,
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): SceneData {
  return {
    ...sceneData,
    mapNodes: collectEditableMapNodes(mapTree),
    mapTree,
  };
}

function findNodePathByName(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  name: string,
): number[] | null {
  function visit(node: HierarchicalMapNode, path: number[]): number[] | null {
    if (node.name === name) return path;

    for (let index = 0; index < (node.children?.length ?? 0); index++) {
      const child = node.children?.[index];
      if (!child) continue;
      const result = visit(child, [...path, index]);
      if (result) return result;
    }

    return null;
  }

  if (Array.isArray(mapTree)) {
    for (let index = 0; index < mapTree.length; index++) {
      const node = mapTree[index];
      if (!node) continue;
      const result = visit(node, [index]);
      if (result) return result;
    }
    return null;
  }

  return visit(mapTree, []);
}

function addTreeNode(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  node: HierarchicalMapNode,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const blockingPath = findNodePathByName(mapTree, "blocking");
  if (!blockingPath) return mapTree;

  return updateTreeNodeAtPath(mapTree, blockingPath, (blockingNode) => ({
    ...blockingNode,
    children: [...(blockingNode.children ?? []), node],
  }));
}

function createNewMapNode(name: string): HierarchicalMapNode {
  const safeName = name.trim() || DEFAULT_NEW_NODE_NAME;

  return {
    name: safeName,
    type: "Object3D",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    children: [
      {
        name: safeName,
        type: "Mesh",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
  };
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

  const handleToggleNodeSelection = useCallback((index: number) => {
    setSelectedNodeIndexes((currentIndexes) => {
      const isSelected = currentIndexes.includes(index);
      const nextIndexes = isSelected
        ? currentIndexes.filter((item) => item !== index)
        : [...currentIndexes, index];

      setSelectedNodeIndex(nextIndexes.at(-1) ?? null);
      if (nextIndexes.length > 0) {
        setCameraViewMode("object");
      } else {
        setCameraViewMode("home");
        setResetCameraRequest((request) => request + 1);
      }

      return nextIndexes;
    });
  }, []);

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

      setSelectedNodeIndex((currentIndex) => {
        if (currentIndex === null) return null;

        const selectedNode = sceneData?.mapNodes[currentIndex];
        if (selectedNode?.name === "terrain") {
          setSelectedNodeIndexes((indexes) =>
            indexes.filter(
              (index) => sceneData?.mapNodes[index]?.name !== "terrain",
            ),
          );
          return null;
        }

        setSelectedNodeIndexes((indexes) =>
          indexes.filter(
            (index) => sceneData?.mapNodes[index]?.name !== "terrain",
          ),
        );
        return currentIndex;
      });
    },
    [sceneData],
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
    setSceneData((prev) => {
      if (!prev) return null;
      if (!prev.mapTree) {
        const newNode = createNewMapNode(newNodeName);
        const mapNodes = [...prev.mapNodes, removeEditorMetadata(newNode)];
        setSelectedNodeIndex(mapNodes.length - 1);
        setSelectedNodeIndexes([mapNodes.length - 1]);
        return { ...prev, mapNodes };
      }

      const mapTree = addTreeNode(prev.mapTree, createNewMapNode(newNodeName));
      const nextSceneData = updateSceneDataTree(prev, mapTree);
      setSelectedNodeIndex(nextSceneData.mapNodes.length - 1);
      setSelectedNodeIndexes([nextSceneData.mapNodes.length - 1]);
      return nextSceneData;
    });
  }, [newNodeName, setSceneData]);

  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedNodeIndex === null) return;

    setSceneData((prev) => {
      if (!prev) return null;
      const currentNode = prev.mapNodes[selectedNodeIndex];
      if (!currentNode) return prev;
      if (!prev.mapTree || !currentNode.sourcePath) {
        setSelectedNodeIndex(null);
        setSelectedNodeIndexes([]);
        return {
          ...prev,
          mapNodes: prev.mapNodes.filter(
            (_node, index) => index !== selectedNodeIndex,
          ),
        };
      }

      const mapTree = removeTreeNodeAtPath(
        prev.mapTree,
        currentNode.sourcePath,
      );
      setSelectedNodeIndex(null);
      setSelectedNodeIndexes([]);
      return updateSceneDataTree(prev, mapTree);
    });
  }, [selectedNodeIndex, setSceneData]);

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
        onCreated={({ gl }) => {
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
          canvas.addEventListener(
            "webglcontextrestored",
            handleContextRestored,
          );
        }}
      >
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
