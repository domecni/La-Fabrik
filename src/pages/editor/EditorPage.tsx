import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EditorControls } from "@/components/editor/EditorControls";
import { EditorScene } from "@/components/editor/scene/EditorScene";
import { useEditorHistory } from "@/hooks/editor/useEditorHistory";
import { useEditorSceneData } from "@/hooks/editor/useEditorSceneData";
import type { MapNode, TransformMode } from "@/types/editor";

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

  const handleHoverNode = useCallback((index: number | null) => {
    setHoveredNodeIndex(index);
  }, []);

  const handleTransformModeChange = useCallback((mode: TransformMode) => {
    setTransformMode(mode);
  }, []);

  const handleSaveToServer = useCallback(async () => {
    if (!sceneData) return;
    const json = JSON.stringify(sceneData.mapNodes, null, 2);

    try {
      const response = await fetch("/api/save-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });

      if (response.ok) {
        alert("Map enregistrée avec succès!");
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error("Error saving map:", err);
      alert("Erreur lors de l'enregistrement");
    }
  }, [sceneData]);

  const handleExportJson = useCallback(() => {
    if (!sceneData) return;
    const json = JSON.stringify(sceneData.mapNodes, null, 2);
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
        <div className="editor-loading">
          <h2>Chargement de l'éditeur...</h2>
          <p>Vérification de map.json dans public/</p>
        </div>
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
                ├── arbre/ │ └── model.gltf ├── building/ │ └── model.gltf └──
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
        <EditorScene
          sceneData={sceneData!}
          selectedNodeIndex={selectedNodeIndex}
          onSelectNode={handleSelectNode}
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
        />
      </Canvas>

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
          undoCount={undoCount}
          redoCount={redoCount}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportJson={handleExportJson}
          onSaveToServer={import.meta.env.DEV ? handleSaveToServer : undefined}
          onPlayerMode={handlePlayerMode}
          isPlayerMode={isPlayerMode}
        />
      )}
    </div>
  );
}
