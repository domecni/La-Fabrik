import type { TransformMode } from "./types";

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
  onResetCamera?: () => void;
  onPlayerMode?: () => void;
  isPlayerMode?: boolean;
}

export default function EditorControls({
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
  onResetCamera,
  onPlayerMode,
  isPlayerMode,
}: EditorControlsProps) {
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

        <div className="transform-buttons">
          <button
            className={`transform-button ${transformMode === "translate" ? "active" : ""}`}
            onClick={() => onTransformModeChange("translate")}
          >
            ✋ Translate (T)
          </button>
          <button
            className={`transform-button ${transformMode === "rotate" ? "active" : ""}`}
            onClick={() => onTransformModeChange("rotate")}
          >
            🔄 Rotate (R)
          </button>
          <button
            className={`transform-button ${transformMode === "scale" ? "active" : ""}`}
            onClick={() => onTransformModeChange("scale")}
          >
            📐 Scale (S)
          </button>
        </div>

        <div className="history-buttons">
          <button
            className="history-button"
            onClick={onUndo}
            disabled={undoCount === 0}
            style={{ color: undoCount > 0 ? "#00ff00" : "#555" }}
          >
            ↩ Undo ({undoCount})
          </button>
          <button
            className="history-button"
            onClick={onRedo}
            disabled={redoCount === 0}
            style={{ color: redoCount > 0 ? "#00ff00" : "#555" }}
          >
            ↪ Redo ({redoCount})
          </button>
        </div>

        <button className="export-button" onClick={onExportJson}>
          💾 Export JSON
        </button>

        {onSaveToServer && (
          <button className="save-button" onClick={onSaveToServer}>
            💾 Save to Server
          </button>
        )}

        <h3>View</h3>

        {onResetCamera && (
          <button className="reset-button" onClick={onResetCamera}>
            🔄 Reset Camera
          </button>
        )}

        {onPlayerMode && (
          <button
            className={`player-button ${isPlayerMode ? "active" : ""}`}
            onClick={onPlayerMode}
          >
            🎮 Player Controller
          </button>
        )}

        <h3>Selection</h3>
        {selectedNodeIndex !== null ? (
          <div className="selected-info">
            <div className="selected-name">
              Selected:{" "}
              <strong>
                {selectedNodeName || `Node ${selectedNodeIndex + 1}`}
              </strong>
            </div>
            <div className="selected-index">
              Index: {selectedNodeIndex + 1} / {nodesCount}
            </div>
          </div>
        ) : (
          <div className="no-selection">No object selected</div>
        )}

        <h3>Controls</h3>
        <div className="controls-help">
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
