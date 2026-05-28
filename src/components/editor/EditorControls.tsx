import {
  Box,
  Braces,
  ChevronDown,
  Download,
  Expand,
  Keyboard,
  Lock,
  MousePointer2,
  Move3D,
  Plus,
  Redo2,
  RotateCw,
  Save,
  Trash2,
  ScanSearch,
  Undo2,
  Unlock,
  X,
} from "lucide-react";
import { EditorCinematicManifestPanel } from "@/components/editor/EditorCinematicManifestPanel";
import { EditorDialogueManifestPanel } from "@/components/editor/EditorDialogueManifestPanel";
import { EditorSrtPanel } from "@/components/editor/EditorSrtPanel";
import type { CinematicDefinition } from "@/types/cinematics/cinematics";
import type { MapNode, TransformMode } from "@/types/editor/editor";
import type { Vector3Tuple } from "@/types/three/three";

interface EditorControlsProps {
  transformMode: TransformMode;
  onTransformModeChange: (mode: TransformMode) => void;
  selectedNodeIndex: number | null;
  selectedNodeIndexes: number[];
  mapNodes: MapNode[];
  nodesCount: number;
  selectedNodeName: string | null;
  selectedNodeScale: Vector3Tuple | null;
  lockTerrainSelection: boolean;
  onLockTerrainSelectionChange: (locked: boolean) => void;
  isSelectionLocked: boolean;
  onSelectionLockToggle: () => void;
  onClearSelection: () => void;
  snapToTerrain: boolean;
  onSnapToTerrainToggle: () => void;
  onSnapAllToTerrain: () => void;
  newNodeName: string;
  onNewNodeNameChange: (value: string) => void;
  onAddNode: () => void;
  onDeleteSelectedNode: () => void;
  onSelectedScaleChange: (axis: 0 | 1 | 2, value: number) => void;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  cameraActionLabel: string;
  onCameraAction: () => void;
  onExportJson: () => void;
  onSaveToServer?: (() => void | Promise<void>) | undefined;
  onPlayerMode?: (() => void) | undefined;
  onPreviewCinematic?: ((cinematic: CinematicDefinition) => void) | undefined;
  isPlayerMode?: boolean;
}

const TRANSFORM_OPTIONS = [
  { mode: "translate", label: "Translate", shortcut: "T", Icon: Move3D },
  { mode: "rotate", label: "Rotate", shortcut: "R", Icon: RotateCw },
  { mode: "scale", label: "Scale", shortcut: "S", Icon: Expand },
] as const;

const EDITOR_SHORTCUTS = [
  ["Click", "Select object"],
  ["Shift + Right click", "Toggle multi-selection"],
  ["T / R / S", "Transform mode"],
  ["Ctrl Z / Y", "Undo / redo"],
  ["Esc / X button", "Clear selection"],
  ["WASD", "Move when locked"],
] as const;

interface EditorPanelGroupProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function EditorPanelGroup({
  title,
  summary,
  defaultOpen = false,
  children,
}: EditorPanelGroupProps): React.JSX.Element {
  return (
    <details className="editor-panel-group" open={defaultOpen}>
      <summary className="editor-panel-group-summary">
        <span>{title}</span>
        <span className="editor-panel-group-meta">
          {summary ? <span>{summary}</span> : null}
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </summary>
      <div className="editor-panel-group-content">{children}</div>
    </details>
  );
}

export function EditorControls({
  transformMode,
  onTransformModeChange,
  selectedNodeIndex,
  selectedNodeIndexes,
  mapNodes,
  nodesCount,
  selectedNodeName,
  selectedNodeScale,
  lockTerrainSelection,
  onLockTerrainSelectionChange,
  isSelectionLocked,
  onSelectionLockToggle,
  onClearSelection,
  snapToTerrain,
  onSnapToTerrainToggle,
  onSnapAllToTerrain,
  newNodeName,
  onNewNodeNameChange,
  onAddNode,
  onDeleteSelectedNode,
  onSelectedScaleChange,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  cameraActionLabel,
  onCameraAction,
  onExportJson,
  onSaveToServer,
  onPlayerMode,
  onPreviewCinematic,
  isPlayerMode,
}: EditorControlsProps): React.JSX.Element {
  const viewModeLabel = isPlayerMode ? "View locked" : "Lock view";
  const jsonPreview = getJsonPreview(mapNodes, selectedNodeIndex);
  const selectedNode =
    selectedNodeIndex !== null ? mapNodes[selectedNodeIndex] : null;
  const selectionCount = selectedNodeIndexes.length;
  const transformValues = getTransformValues(selectedNode ?? null);

  return (
    <>
      <aside className="editor-controls-panel" aria-label="Editor controls">
        <header className="editor-panel-header">
          <span className="editor-panel-kicker">Map Editor</span>
          <h2>Scene controls</h2>
          <p>Select an object, choose a transform mode, then drag the gizmo.</p>
        </header>

        <EditorPanelGroup title="Editor" summary="Map tools" defaultOpen>
          <EditorPanelGroup title="Shortcuts" summary="Keys">
            <section
              className="editor-control-section"
              aria-labelledby="shortcuts-heading"
            >
              <div className="editor-section-heading">
                <h3 id="shortcuts-heading">Shortcuts</h3>
                <Keyboard size={15} aria-hidden="true" />
              </div>

              <dl className="editor-shortcuts-list">
                {EDITOR_SHORTCUTS.map(([keys, description]) => (
                  <div key={keys}>
                    <dt>{keys}</dt>
                    <dd>{description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </EditorPanelGroup>

          <section
            className="editor-control-section"
            aria-labelledby="transform-heading"
          >
            <div className="editor-section-heading">
              <h3 id="transform-heading">Transform</h3>
              <span>T / R / S</span>
            </div>

            <div className="editor-transform-buttons">
              {TRANSFORM_OPTIONS.map(({ mode, label, shortcut, Icon }) => (
                <button
                  key={mode}
                  className={`editor-transform-button ${transformMode === mode ? "active" : ""}`}
                  onClick={() => onTransformModeChange(mode)}
                  aria-pressed={transformMode === mode}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="editor-transform-label">
                    <span>{label}</span>
                    <small>{transformValues[mode]}</small>
                  </span>
                  <kbd>{shortcut}</kbd>
                </button>
              ))}
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

            <label className="editor-checkbox-row">
              <input
                type="checkbox"
                checked={snapToTerrain}
                onChange={onSnapToTerrainToggle}
              />
              <span>Snap terrain on move</span>
            </label>

            <button
              type="button"
              className="editor-history-button"
              onClick={onSnapAllToTerrain}
            >
              <ScanSearch size={15} aria-hidden="true" />
              Snap all to terrain
            </button>
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
                    {selectionCount > 1
                      ? `${selectionCount} selected nodes`
                      : selectedNodeName || `Node ${selectedNodeIndex + 1}`}
                  </strong>
                  <span>
                    {selectionCount > 1
                      ? `Primary index ${selectedNodeIndex + 1} of ${nodesCount}`
                      : `Index ${selectedNodeIndex + 1} of ${nodesCount}`}
                  </span>
                </div>
                <div className="editor-selected-actions">
                  <button
                    type="button"
                    onClick={onDeleteSelectedNode}
                    aria-label="Delete selected node"
                    title="Delete selected node"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onSelectionLockToggle}
                    aria-pressed={isSelectionLocked}
                    aria-label={
                      isSelectionLocked ? "Unlock selection" : "Lock selection"
                    }
                    title={
                      isSelectionLocked ? "Unlock selection" : "Lock selection"
                    }
                  >
                    {isSelectionLocked ? (
                      <Lock size={14} aria-hidden="true" />
                    ) : (
                      <Unlock size={14} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClearSelection}
                    aria-label="Clear selection"
                    title="Clear selection"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
                {selectedNodeScale ? (
                  <div className="editor-scale-fields">
                    {selectedNodeScale.map((value, axis) => (
                      <label key={axis}>
                        <span>{["X", "Y", "Z"][axis]}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(value.toFixed(4))}
                          onChange={(event) =>
                            onSelectedScaleChange(
                              axis as 0 | 1 | 2,
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : null}
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
            aria-labelledby="add-node-heading"
          >
            <div className="editor-section-heading">
              <h3 id="add-node-heading">Add Node</h3>
            </div>

            <div className="editor-add-node-row">
              <input
                type="text"
                value={newNodeName}
                onChange={(event) => onNewNodeNameChange(event.target.value)}
                placeholder="model-folder-name"
              />
              <button
                type="button"
                className="editor-action-button"
                onClick={onAddNode}
              >
                <Plus size={16} aria-hidden="true" />
                Add cube
              </button>
            </div>
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

            <button className="editor-action-button" onClick={onCameraAction}>
              <ScanSearch size={16} aria-hidden="true" />
              {cameraActionLabel}
            </button>

            <label className="editor-checkbox-row">
              <input
                type="checkbox"
                checked={lockTerrainSelection}
                onChange={(event) =>
                  onLockTerrainSelectionChange(event.currentTarget.checked)
                }
              />
              <span>
                <strong>Lock terrain</strong>
                <small>Keep terrain visible but ignore terrain clicks</small>
              </span>
            </label>
          </section>

          <section
            className="editor-json-section"
            aria-labelledby="json-heading"
          >
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
        </EditorPanelGroup>

        <EditorPanelGroup title="Cinematics" summary="Timeline">
          <EditorCinematicManifestPanel
            onPreviewCinematic={onPreviewCinematic}
          />
        </EditorPanelGroup>
        <EditorPanelGroup title="Dialogues" summary="Manifest">
          <EditorDialogueManifestPanel />
        </EditorPanelGroup>
        <EditorPanelGroup title="SRT" summary="Subtitles">
          <EditorSrtPanel />
        </EditorPanelGroup>
      </aside>
    </>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatVector(values: readonly [number, number, number]): string {
  return `X ${formatNumber(values[0])} · Y ${formatNumber(values[1])} · Z ${formatNumber(values[2])}`;
}

function formatRotation(values: readonly [number, number, number]): string {
  const degrees = values.map((value) => (value * 180) / Math.PI) as [
    number,
    number,
    number,
  ];

  return `X ${formatNumber(degrees[0])}° · Y ${formatNumber(degrees[1])}° · Z ${formatNumber(degrees[2])}°`;
}

function getTransformValues(
  node: MapNode | null,
): Record<TransformMode, string> {
  if (!node) {
    return {
      translate: "No selection",
      rotate: "No selection",
      scale: "No selection",
    };
  }

  return {
    translate: formatVector(node.position),
    rotate: formatRotation(node.rotation),
    scale: formatVector(node.scale),
  };
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
    const serializableNode = {
      name: node.name,
      position: node.position,
      rotation: node.rotation,
      scale: node.scale,
      type: node.type,
    };
    const objectLines = JSON.stringify(serializableNode, null, 2)
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
