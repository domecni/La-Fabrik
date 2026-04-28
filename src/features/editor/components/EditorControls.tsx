import type { TransformMode } from "@/types/editor";

interface EditorControlsProps {
  transformMode: TransformMode;
  onTransformModeChange: (mode: TransformMode) => void;
  selectedNodeIndex: number | null;
  nodesCount: number;
  selectedNodeName: string | null;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onExportJson: () => void;
  onSaveToServer?: () => void;
  onPlayerMode?: () => void;
  isPlayerMode?: boolean;
}

export function EditorControls({
  transformMode,
  onTransformModeChange,
  selectedNodeIndex,
  nodesCount,
  selectedNodeName,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  onExportJson,
  onSaveToServer,
  onPlayerMode,
  isPlayerMode,
}: EditorControlsProps): React.JSX.Element {
  const cameraPosition = [0, 50, 100];

  return (
    <>
      <div className="editor-camera-info">
        <div>Camera Position:</div>
        <div>X: {cameraPosition[0]!.toFixed(2)}</div>
        <div>Y: {cameraPosition[1]!.toFixed(2)}</div>
        <div>Z: {cameraPosition[2]!.toFixed(2)}</div>
      </div>

      <div className="editor-controls-panel">
        <h3>Transform</h3>

        <div className="editor-transform-buttons">
          <button
            className={`editor-transform-button ${transformMode === "translate" ? "active" : ""}`}
            onClick={() => onTransformModeChange("translate")}
          >
            ✋ Translate (T)
          </button>
          <button
            className={`editor-transform-button ${transformMode === "rotate" ? "active" : ""}`}
            onClick={() => onTransformModeChange("rotate")}
          >
            🔄 Rotate (R)
          </button>
          <button
            className={`editor-transform-button ${transformMode === "scale" ? "active" : ""}`}
            onClick={() => onTransformModeChange("scale")}
          >
            📐 Scale (S)
          </button>
        </div>

        <div className="editor-history-buttons">
          <button
            className="editor-history-button"
            onClick={onUndo}
            disabled={undoCount === 0}
            style={{ color: undoCount > 0 ? "#00ff00" : "#555" }}
          >
            ↩ Undo ({undoCount})
          </button>
          <button
            className="editor-history-button"
            onClick={onRedo}
            disabled={redoCount === 0}
            style={{ color: redoCount > 0 ? "#00ff00" : "#555" }}
          >
            ↪ Redo ({redoCount})
          </button>
        </div>

        <button className="editor-export-button" onClick={onExportJson}>
          💾 Export JSON
        </button>

        {onSaveToServer && (
          <button className="editor-save-button" onClick={onSaveToServer}>
            💾 Save to Server
          </button>
        )}

        <h3>View</h3>

        {onPlayerMode && (
          <button
            className={`editor-player-button ${isPlayerMode ? "active" : ""}`}
            onClick={onPlayerMode}
          >
            🎮 Player Controller
          </button>
        )}

        <h3>Selection</h3>
        {selectedNodeIndex !== null ? (
          <div className="editor-selected-info">
            <div className="editor-selected-name">
              Selected:{" "}
              <strong>
                {selectedNodeName || `Node ${selectedNodeIndex + 1}`}
              </strong>
            </div>
            <div className="editor-selected-index">
              Index: {selectedNodeIndex + 1} / {nodesCount}
            </div>
          </div>
        ) : (
          <div className="editor-no-selection">No object selected</div>
        )}

        <h3>Controls</h3>
        <div className="editor-controls-help">
          <p>Click - Select object</p>
          <p>T/R/S - Transform mode</p>
          <p>Ctrl+Z - Undo</p>
          <p>Ctrl+Y - Redo</p>
          <p>ESC - Deselect</p>
          <p>WASD/ZQSD - Move (Player mode)</p>
          <p>Space - Jump (Player mode)</p>
        </div>
      </div>
    </>
  );
}
