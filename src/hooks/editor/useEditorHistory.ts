import { useCallback, useRef, useState } from "react";
import type { MapNode, SceneData } from "@/types/editor/editor";

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

  saveSnapshot(objects: ObjectTransform[]): void {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(objects.map((object) => ({ ...object })));
    this.currentIndex = this.history.length - 1;

    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): ObjectTransform[] | undefined {
    if (this.currentIndex <= 0) return undefined;

    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  redo(): ObjectTransform[] | undefined {
    if (this.currentIndex >= this.history.length - 1) return undefined;

    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  getUndoCount(): number {
    return this.currentIndex;
  }

  getRedoCount(): number {
    return this.history.length - 1 - this.currentIndex;
  }
}

interface UseEditorHistoryResult {
  undoCount: number;
  redoCount: number;
  handleUndo: () => void;
  handleRedo: () => void;
  handleTransformStart: () => void;
  handleTransformEnd: () => void;
}

export function useEditorHistory(
  sceneData: SceneData | null,
  setSceneData: React.Dispatch<React.SetStateAction<SceneData | null>>,
): UseEditorHistoryResult {
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const historyManager = useRef(new HistoryManager(50));

  const updateHistoryCounts = useCallback(() => {
    setUndoCount(historyManager.current.getUndoCount());
    setRedoCount(historyManager.current.getRedoCount());
  }, []);

  const applySnapshot = useCallback(
    (snapshot: ObjectTransform[]): void => {
      setSceneData((prev) => {
        if (!prev) return null;

        const mapNodes = prev.mapNodes.map((node, index) => {
          const transform = snapshot.find(
            (item) => item.uuid === `node-${index}`,
          );
          if (!transform) return node;

          return {
            ...node,
            position: [
              transform.position.x,
              transform.position.y,
              transform.position.z,
            ],
            rotation: [
              transform.rotation.x,
              transform.rotation.y,
              transform.rotation.z,
            ],
            scale: [transform.scale.x, transform.scale.y, transform.scale.z],
          } satisfies MapNode;
        });

        return { ...prev, mapNodes };
      });
    },
    [setSceneData],
  );

  const handleUndo = useCallback(() => {
    const snapshot = historyManager.current.undo();
    if (!snapshot) return;

    applySnapshot(snapshot);
    updateHistoryCounts();
  }, [applySnapshot, updateHistoryCounts]);

  const handleRedo = useCallback(() => {
    const snapshot = historyManager.current.redo();
    if (!snapshot) return;

    applySnapshot(snapshot);
    updateHistoryCounts();
  }, [applySnapshot, updateHistoryCounts]);

  const handleTransformStart = useCallback(() => {
    if (!sceneData) return;
    historyManager.current.saveSnapshot(createSnapshot(sceneData));
  }, [sceneData]);

  const handleTransformEnd = useCallback(() => {
    if (!sceneData) return;
    historyManager.current.saveSnapshot(createSnapshot(sceneData));
    updateHistoryCounts();
  }, [sceneData, updateHistoryCounts]);

  return {
    undoCount,
    redoCount,
    handleUndo,
    handleRedo,
    handleTransformStart,
    handleTransformEnd,
  };
}

function createSnapshot(sceneData: SceneData): ObjectTransform[] {
  return sceneData.mapNodes.map((node, index) => ({
    uuid: `node-${index}`,
    position: {
      x: node.position[0],
      y: node.position[1],
      z: node.position[2],
    },
    rotation: {
      x: node.rotation[0],
      y: node.rotation[1],
      z: node.rotation[2],
    },
    scale: { x: node.scale[0], y: node.scale[1], z: node.scale[2] },
  }));
}
