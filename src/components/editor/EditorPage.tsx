import { useEffect, useState, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import EditorViewer from "./EditorViewer";
import EditorControls from "./EditorControls";
import type { TransformMode, MapNode } from "./types";
import type { SceneData } from "./types";
import "./EditorPage.css";

interface ObjectTransform {
  uuid: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

class HistoryManager {
  private history: ObjectTransform[][] = [];
  private currentIndex = -1;
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  saveSnapshot(objects: ObjectTransform[]) {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(objects.map((obj) => ({ ...obj })));

    this.currentIndex = this.history.length - 1;

    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): ObjectTransform[] | undefined {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  redo(): ObjectTransform[] | undefined {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  getUndoCount(): number {
    return this.currentIndex;
  }

  getRedoCount(): number {
    return this.history.length - 1 - this.currentIndex;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}

export function EditorPage(): React.JSX.Element {
  const [hasMapJson, setHasMapJson] = useState<boolean>(false);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [sceneData, setSceneData] = useState<SceneData | null>(null);

  // État partagé entre Canvas (3D) et EditorControls (HTML)
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(
    null,
  );
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [isPlayerMode, setIsPlayerMode] = useState(false);

  const historyManagerRef = useCallback(() => new HistoryManager(50), []);
  const historyManager = useRef<HistoryManager>(historyManagerRef());

  // Callbacks partagés
  const handleSelectNode = useCallback((index: number | null) => {
    setSelectedNodeIndex(index);
  }, []);

  const handleHoverNode = useCallback((index: number | null) => {
    setHoveredNodeIndex(index);
  }, []);

  const handleTransformModeChange = useCallback((mode: TransformMode) => {
    setTransformMode(mode);
  }, []);

  const applySnapshot = useCallback((snapshot: ObjectTransform[]) => {
    if (!sceneData) return;
    setSceneData((prev) => {
      if (!prev) return null;
      const newMapNodes = prev.mapNodes.map((node, index) => {
        const transform = snapshot.find((s) => s.uuid === `node-${index}`);
        if (transform) {
          return {
            ...node,
            position: [transform.position.x, transform.position.y, transform.position.z] as [number, number, number],
            rotation: [transform.rotation.x, transform.rotation.y, transform.rotation.z] as [number, number, number],
            scale: [transform.scale.x, transform.scale.y, transform.scale.z] as [number, number, number],
          };
        }
        return node;
      });
      return { ...prev, mapNodes: newMapNodes };
    });
  }, [sceneData]);

  const handleUndo = useCallback(() => {
    const snapshot = historyManager.current.undo();
    if (snapshot) {
      applySnapshot(snapshot);
      setUndoCount(historyManager.current.getUndoCount());
      setRedoCount(historyManager.current.getRedoCount());
    }
  }, [applySnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = historyManager.current.redo();
    if (snapshot) {
      applySnapshot(snapshot);
      setUndoCount(historyManager.current.getUndoCount());
      setRedoCount(historyManager.current.getRedoCount());
    }
  }, [applySnapshot]);

  const handleExportJson = useCallback(() => {
    if (!sceneData) return;
    const json = JSON.stringify(sceneData.mapNodes, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [sceneData]);

  const handleResetCamera = useCallback(() => {
    // Logique pour reset camera
    console.log("Reset camera");
  }, []);

  const handlePlayerMode = useCallback(() => {
    setIsPlayerMode((prev) => !prev);
  }, []);

  const handleTransformStart = useCallback(() => {
    if (!sceneData) return;
    const snapshot = sceneData.mapNodes.map((node, index) => ({
      uuid: `node-${index}`,
      position: { x: node.position[0], y: node.position[1], z: node.position[2] },
      rotation: { x: node.rotation[0], y: node.rotation[1], z: node.rotation[2] },
      scale: { x: node.scale[0], y: node.scale[1], z: node.scale[2] },
    }));
    historyManager.current.saveSnapshot(snapshot);
  }, [sceneData]);

  const handleTransformEnd = useCallback(() => {
    if (!sceneData) return;
    const snapshot = sceneData.mapNodes.map((node, index) => ({
      uuid: `node-${index}`,
      position: { x: node.position[0], y: node.position[1], z: node.position[2] },
      rotation: { x: node.rotation[0], y: node.rotation[1], z: node.rotation[2] },
      scale: { x: node.scale[0], y: node.scale[1], z: node.scale[2] },
    }));
    historyManager.current.saveSnapshot(snapshot);
    setUndoCount(historyManager.current.getUndoCount());
    setRedoCount(historyManager.current.getRedoCount());
  }, [sceneData]);

  const handleNodeTransform = useCallback(
    (nodeIndex: number, updatedNode: MapNode) => {
      if (!sceneData) return;
      setSceneData((prev) => {
        if (!prev) return null;
        const newMapNodes = [...prev.mapNodes];
        newMapNodes[nodeIndex] = updatedNode;
        return { ...prev, mapNodes: newMapNodes };
      });
      setUndoCount((prev) => prev + 1);
      console.log("Node transformed:", nodeIndex);
    },
    [sceneData],
  );

  useEffect(() => {
    const loadMapData = async (): Promise<void> => {
      setIsMapLoading(true);

      try {
        const response = await fetch("/map.json");

        if (!response.ok) {
          setHasMapJson(false);
          setIsMapLoading(false);
          return;
        }

        const mapNodes = await response.json();

        const models = new Map<string, string>();

        try {
          const traverseModels = async (path: string): Promise<void> => {
            try {
              const response = await fetch(path);
              if (!response.ok) return;
              const text = await response.text();

              if (text.includes("index")) {
                const modelUrl = path.replace(/\/$/, "") + "/model.glb";
                const modelResponse = await fetch(modelUrl);
                if (modelResponse.ok) {
                  const blob = await modelResponse.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const pathParts = path.split("/").filter(Boolean);
                  const modelName = pathParts[pathParts.length - 1] || "";
                  models.set(modelName, blobUrl);
                }
              }
            } catch {}
          };

          const baseResponse = await fetch("/models/");
          if (baseResponse.ok) {
            const text = await baseResponse.text();
            const lines = text.split("\n");
            for (const line of lines) {
              if (line.includes("href") && line.includes("/")) {
                const match = line.match(/href="([^"]+)"/);
                if (match && match[1]) {
                  const href = match[1];
                  if (href.endsWith("/")) {
                    await traverseModels(href);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn("Could not scan models directory:", error);
        }

        setSceneData({ mapNodes, models });
        setHasMapJson(true);
      } catch (error) {
        console.error("Error loading map data:", error);
        setHasMapJson(false);
      } finally {
        setIsMapLoading(false);
      }
    };

    loadMapData();
  }, []);

  const handleFolderUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const files = event.target.files;
    if (!files) return;

    const fileMap = new Map<string, File>();
    for (const file of Array.from(files)) {
      const webkitRelativePath =
        (file as any).webkitRelativePath || "/" + file.name;
      fileMap.set(webkitRelativePath, file);
    }

    const mapFile = fileMap.get("/map.json");
    if (!mapFile) {
      alert("Fichier map.json manquant à la racine du dossier");
      return;
    }

    try {
      const mapText = await mapFile.text();
      const mapNodes = JSON.parse(mapText);

      const models = new Map<string, string>();

      for (const [path, file] of fileMap.entries()) {
        const modelMatch = path && path.match(/^\/models\/(.+)\/model\.glb$/);
        if (modelMatch && modelMatch[1]) {
          const modelName = modelMatch[1];
          const blobUrl = URL.createObjectURL(file);
          models.set(modelName, blobUrl);
        }
      }

      setSceneData({ mapNodes, models });
      setHasMapJson(true);
    } catch (error) {
      console.error("Error processing upload:", error);
      alert("Erreur lors du traitement du dossier");
    }
  };

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

          <div className="upload-section">
            <h3>Télécharger un dossier contenant map.json</h3>

            <label className="drop-zone">
              <input
                type="file"
                className="folder-input"
                onChange={handleFolderUpload}
              />
              Choisir un dossier contenant map.json
            </label>

            <div className="folder-structure">
              <h4>Structure requise :</h4>
              <pre>
                public/ ├── <strong>map.json</strong> (à la racine) └── models/
                ├── arbre/ │ └── model.glb ├── building/ │ └── model.glb └── ...
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
          gl.setClearColor("#1e293b");
        }}
      >
        <EditorViewer
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

      {/* EditorControls rendu en dehors du Canvas (HTML overlay) */}
      {sceneData && (
        <EditorControls
          transformMode={transformMode}
          onTransformModeChange={handleTransformModeChange}
          selectedNodeIndex={selectedNodeIndex}
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
          onResetCamera={handleResetCamera}
          onPlayerMode={handlePlayerMode}
          isPlayerMode={isPlayerMode}
        />
      )}
    </div>
  );
}
