import {
  Box,
  Braces,
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
import type { MapNode, TransformMode } from "@/types/editor";

interface EditorControlsProps {
  transformMode: TransformMode;
  onTransformModeChange: (mode: TransformMode) => void;
  selectedNodeIndex: number | null;
  mapNodes: MapNode[];
  nodesCount: number;
  selectedNodeName: string | null;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onExportJson: () => void;
  onSaveToServer?: (() => void | Promise<void>) | undefined;
  onPlayerMode?: (() => void) | undefined;
  isPlayerMode?: boolean;
}

export function EditorControls({
  transformMode,
  onTransformModeChange,
  selectedNodeIndex,
  mapNodes,
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
  const viewModeLabel = isPlayerMode ? "View locked" : "Lock view";
  const jsonPreview = getJsonPreview(mapNodes, selectedNodeIndex);

  return (
    <>
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

        <section className="editor-json-section" aria-labelledby="json-heading">
          <div className="editor-section-heading">
            <h3 id="json-heading">JSON</h3>
            <span>{jsonPreview.label}</span>
          </div>

          <pre className="editor-json-view" aria-label={jsonPreview.label}>
            {jsonPreview.lines.map((line) => (
              <code
                key={line.number}
                className={line.isSelected ? "is-selected" : undefined}
              >
                <span>{line.number}</span>
                {line.content || " "}
              </code>
            ))}
          </pre>

          <div className="editor-json-hint">
            <Braces size={14} aria-hidden="true" />
            {selectedNodeIndex === null
              ? "Raw map JSON"
              : `Selected node ${selectedNodeIndex + 1} raw lines`}
          </div>
        </section>
      </aside>
    </>
  );
}

interface JsonPreviewLine {
  number: number;
  content: string;
  isSelected: boolean;
}

interface JsonPreview {
  label: string;
  lines: JsonPreviewLine[];
}

function getJsonPreview(
  mapNodes: MapNode[],
  selectedNodeIndex: number | null,
): JsonPreview {
  const { lines, ranges } = formatMapNodesWithRanges(mapNodes);

  if (selectedNodeIndex === null || !ranges[selectedNodeIndex]) {
    return {
      label: `${lines.length} raw lines`,
      lines: lines.map((content, index) => ({
        number: index + 1,
        content,
        isSelected: false,
      })),
    };
  }

  const range = ranges[selectedNodeIndex];
  const selectedLines = lines.slice(range.start - 1, range.end);

  return {
    label: `Lines ${range.start}-${range.end}`,
    lines: selectedLines.map((content, index) => ({
      number: range.start + index,
      content,
      isSelected: true,
    })),
  };
}

function formatMapNodesWithRanges(mapNodes: MapNode[]): {
  lines: string[];
  ranges: Array<{ start: number; end: number }>;
} {
  const lines = ["["];
  const ranges: Array<{ start: number; end: number }> = [];

  mapNodes.forEach((node, index) => {
    const objectLines = JSON.stringify(node, null, 2)
      .split("\n")
      .map((line) => `  ${line}`);

    if (index < mapNodes.length - 1) {
      objectLines[objectLines.length - 1] += ",";
    }

    const start = lines.length + 1;
    lines.push(...objectLines);
    ranges.push({ start, end: lines.length });
  });

  lines.push("]");

  return { lines, ranges };
}
