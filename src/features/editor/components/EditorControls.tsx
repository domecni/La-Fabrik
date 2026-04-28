import {
  Box,
  Download,
  Expand,
  Keyboard,
  Lock,
  MousePointer2,
  Move3D,
  Redo2,
  RotateCw,
  Save,
  Undo2,
} from "lucide-react";
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
  const viewModeLabel = isPlayerMode ? "View locked" : "Lock view";

  return (
    <>
      <div className="editor-camera-info">
        <span>Camera</span>
        <strong>
          X {cameraPosition[0]!.toFixed(0)} · Y {cameraPosition[1]!.toFixed(0)}{" "}
          · Z {cameraPosition[2]!.toFixed(0)}
        </strong>
      </div>

      <aside className="editor-controls-panel" aria-label="Editor controls">
        <header className="editor-panel-header">
          <span className="editor-panel-kicker">Map Editor</span>
          <h2>Scene controls</h2>
          <p>Select an object, choose a transform mode, then drag the gizmo.</p>
        </header>

        <section
          className="editor-control-section"
          aria-labelledby="transform-heading"
        >
          <div className="editor-section-heading">
            <h3 id="transform-heading">Transform</h3>
            <span>T / R / S</span>
          </div>

          <div className="editor-transform-buttons">
            <button
              className={`editor-transform-button ${transformMode === "translate" ? "active" : ""}`}
              onClick={() => onTransformModeChange("translate")}
              aria-pressed={transformMode === "translate"}
            >
              <Move3D size={16} aria-hidden="true" />
              <span>Translate</span>
              <kbd>T</kbd>
            </button>
            <button
              className={`editor-transform-button ${transformMode === "rotate" ? "active" : ""}`}
              onClick={() => onTransformModeChange("rotate")}
              aria-pressed={transformMode === "rotate"}
            >
              <RotateCw size={16} aria-hidden="true" />
              <span>Rotate</span>
              <kbd>R</kbd>
            </button>
            <button
              className={`editor-transform-button ${transformMode === "scale" ? "active" : ""}`}
              onClick={() => onTransformModeChange("scale")}
              aria-pressed={transformMode === "scale"}
            >
              <Expand size={16} aria-hidden="true" />
              <span>Scale</span>
              <kbd>S</kbd>
            </button>
          </div>

          <div className="editor-history-buttons">
            <button
              className="editor-history-button"
              onClick={onUndo}
              disabled={undoCount === 0}
            >
              <Undo2 size={15} aria-hidden="true" />
              Undo
              <span>{undoCount}</span>
            </button>
            <button
              className="editor-history-button"
              onClick={onRedo}
              disabled={redoCount === 0}
            >
              <Redo2 size={15} aria-hidden="true" />
              Redo
              <span>{redoCount}</span>
            </button>
          </div>
        </section>

        <section
          className="editor-control-section"
          aria-labelledby="file-heading"
        >
          <div className="editor-section-heading">
            <h3 id="file-heading">File</h3>
          </div>

          <button
            className="editor-action-button editor-action-button-primary"
            onClick={onExportJson}
          >
            <Download size={16} aria-hidden="true" />
            Export JSON
          </button>

          {onSaveToServer && (
            <button className="editor-action-button" onClick={onSaveToServer}>
              <Save size={16} aria-hidden="true" />
              Save to server
            </button>
          )}
        </section>

        <section
          className="editor-control-section"
          aria-labelledby="view-heading"
        >
          <div className="editor-section-heading">
            <h3 id="view-heading">View</h3>
          </div>

          {onPlayerMode && (
            <button
              className={`editor-player-button ${isPlayerMode ? "active" : ""}`}
              onClick={onPlayerMode}
              aria-pressed={isPlayerMode}
            >
              <Lock size={16} aria-hidden="true" />
              {viewModeLabel}
            </button>
          )}
        </section>

        <section
          className="editor-control-section"
          aria-labelledby="selection-heading"
        >
          <div className="editor-section-heading">
            <h3 id="selection-heading">Selection</h3>
            <span>{nodesCount} nodes</span>
          </div>

          {selectedNodeIndex !== null ? (
            <div className="editor-selected-info">
              <Box size={17} aria-hidden="true" />
              <div>
                <strong>
                  {selectedNodeName || `Node ${selectedNodeIndex + 1}`}
                </strong>
                <span>
                  Index {selectedNodeIndex + 1} of {nodesCount}
                </span>
              </div>
            </div>
          ) : (
            <div className="editor-no-selection">
              <MousePointer2 size={17} aria-hidden="true" />
              No object selected
            </div>
          )}
        </section>

        <section
          className="editor-control-section"
          aria-labelledby="shortcuts-heading"
        >
          <div className="editor-section-heading">
            <h3 id="shortcuts-heading">Shortcuts</h3>
            <Keyboard size={15} aria-hidden="true" />
          </div>

          <dl className="editor-shortcuts-list">
            <div>
              <dt>Click</dt>
              <dd>Select object</dd>
            </div>
            <div>
              <dt>T / R / S</dt>
              <dd>Transform mode</dd>
            </div>
            <div>
              <dt>Ctrl Z / Y</dt>
              <dd>Undo / redo</dd>
            </div>
            <div>
              <dt>Esc</dt>
              <dd>Deselect</dd>
            </div>
            <div>
              <dt>WASD</dt>
              <dd>Move when locked</dd>
            </div>
          </dl>
        </section>
      </aside>
    </>
  );
}
