import { useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import type {
  CinematicCameraKeyframe,
  CinematicDefinition,
  CinematicManifest,
} from "@/types/cinematics/cinematics";
import type { Vector3Tuple } from "@/types/three/three";
import { loadCinematicManifest } from "@/utils/cinematics/loadCinematicManifest";

type CinematicPatch = Partial<Omit<CinematicDefinition, "timecode">> & {
  timecode?: number | undefined;
};

type VectorAxis = 0 | 1 | 2;
const VECTOR_AXES: { label: "X" | "Y" | "Z"; axis: VectorAxis }[] = [
  { label: "X", axis: 0 },
  { label: "Y", axis: 1 },
  { label: "Z", axis: 2 },
];

function createCinematic(index: number): CinematicDefinition {
  return {
    id: `new_cinematic_${index}`,
    cameraKeyframes: [
      { time: 0, position: [0, 3, 8], target: [0, 1.5, 0] },
      { time: 3, position: [6, 3, 8], target: [0, 1.5, 0] },
    ],
  };
}

function createKeyframe(
  previousKeyframe: CinematicCameraKeyframe,
): CinematicCameraKeyframe {
  return {
    time: previousKeyframe.time + 3,
    position: [...previousKeyframe.position],
    target: [...previousKeyframe.target],
  };
}

function getManifestErrors(manifest: CinematicManifest | null): string[] {
  if (!manifest) return ["Manifeste absent."];

  const errors: string[] = [];
  const ids = new Set<string>();

  manifest.cinematics.forEach((cinematic, cinematicIndex) => {
    const label = cinematic.id || `Cinematique ${cinematicIndex + 1}`;

    if (!cinematic.id.trim()) errors.push(`${label}: id obligatoire.`);
    if (ids.has(cinematic.id)) errors.push(`${label}: id duplique.`);
    ids.add(cinematic.id);

    if (
      cinematic.timecode !== undefined &&
      (!Number.isFinite(cinematic.timecode) || cinematic.timecode < 0)
    ) {
      errors.push(`${label}: timecode invalide.`);
    }

    if (cinematic.cameraKeyframes.length < 2) {
      errors.push(`${label}: au moins deux keyframes camera sont requises.`);
    }

    cinematic.cameraKeyframes.forEach((keyframe, keyframeIndex) => {
      const previousKeyframe = cinematic.cameraKeyframes[keyframeIndex - 1];

      if (!Number.isFinite(keyframe.time) || keyframe.time < 0) {
        errors.push(`${label}: keyframe ${keyframeIndex + 1} time invalide.`);
      }

      if (previousKeyframe && keyframe.time <= previousKeyframe.time) {
        errors.push(`${label}: les temps des keyframes doivent augmenter.`);
      }
    });
  });

  return errors;
}

async function saveCinematicManifest(
  manifest: CinematicManifest,
): Promise<void> {
  const response = await fetch("/api/save-cinematics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manifest),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Sauvegarde des cinematics impossible");
  }
}

function getPatchedCinematic(
  cinematic: CinematicDefinition,
  patch: CinematicPatch,
): CinematicDefinition {
  const nextCinematic: CinematicDefinition = {
    id: patch.id ?? cinematic.id,
    cameraKeyframes: patch.cameraKeyframes ?? cinematic.cameraKeyframes,
  };

  if ("timecode" in patch) {
    if (patch.timecode !== undefined) nextCinematic.timecode = patch.timecode;
  } else if (cinematic.timecode !== undefined) {
    nextCinematic.timecode = cinematic.timecode;
  }

  return nextCinematic;
}

function updateVector(
  vector: Vector3Tuple,
  axis: VectorAxis,
  value: number,
): Vector3Tuple {
  const nextVector: Vector3Tuple = [...vector];
  nextVector[axis] = value;
  return nextVector;
}

export function EditorCinematicManifestPanel(): React.JSX.Element {
  const [manifest, setManifest] = useState<CinematicManifest | null>(null);
  const [selectedCinematicId, setSelectedCinematicId] = useState("");
  const [status, setStatus] = useState("Chargement des cinematics...");
  const [isSaving, setIsSaving] = useState(false);
  const errors = getManifestErrors(manifest);
  const selectedCinematic =
    manifest?.cinematics.find(
      (cinematic) => cinematic.id === selectedCinematicId,
    ) ??
    manifest?.cinematics[0] ??
    null;

  async function handleLoad(): Promise<void> {
    setStatus("Chargement des cinematics...");

    try {
      const loadedManifest = await loadCinematicManifest();
      setManifest(loadedManifest);
      setSelectedCinematicId(loadedManifest?.cinematics[0]?.id ?? "");
      setStatus(
        loadedManifest
          ? `Manifeste charge: ${loadedManifest.cinematics.length} cinematics.`
          : "Manifeste cinematics introuvable ou invalide.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(message);
      setManifest(null);
    }
  }

  async function handleSave(): Promise<void> {
    if (!manifest) return;
    if (errors.length > 0) {
      setStatus("Corrige les erreurs avant de sauvegarder.");
      return;
    }

    setIsSaving(true);
    setStatus("Sauvegarde des cinematics...");

    try {
      await saveCinematicManifest(manifest);
      setStatus("Manifeste sauvegarde dans public/cinematics.json.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddCinematic(): void {
    if (!manifest) return;

    const cinematic = createCinematic(manifest.cinematics.length + 1);
    setManifest({
      ...manifest,
      cinematics: [...manifest.cinematics, cinematic],
    });
    setSelectedCinematicId(cinematic.id);
    setStatus("Nouvelle cinematic ajoutee localement.");
  }

  function handleRemoveCinematic(cinematicId: string): void {
    if (!manifest) return;

    const nextCinematics = manifest.cinematics.filter(
      (cinematic) => cinematic.id !== cinematicId,
    );
    setManifest({ ...manifest, cinematics: nextCinematics });
    setSelectedCinematicId(nextCinematics[0]?.id ?? "");
    setStatus("Cinematic supprimee localement.");
  }

  function updateSelectedCinematic(
    patch: CinematicPatch,
    nextId = selectedCinematicId,
  ): void {
    if (!manifest || !selectedCinematic) return;

    setManifest({
      ...manifest,
      cinematics: manifest.cinematics.map((cinematic) =>
        cinematic.id === selectedCinematic.id
          ? getPatchedCinematic(cinematic, patch)
          : cinematic,
      ),
    });
    setSelectedCinematicId(nextId);
  }

  function updateKeyframe(
    keyframeIndex: number,
    patch: Partial<CinematicCameraKeyframe>,
  ): void {
    if (!selectedCinematic) return;

    updateSelectedCinematic({
      cameraKeyframes: selectedCinematic.cameraKeyframes.map(
        (keyframe, index) =>
          index === keyframeIndex ? { ...keyframe, ...patch } : keyframe,
      ),
    });
  }

  function handleAddKeyframe(): void {
    if (!selectedCinematic) return;

    const previousKeyframe =
      selectedCinematic.cameraKeyframes[
        selectedCinematic.cameraKeyframes.length - 1
      ];
    if (!previousKeyframe) return;

    updateSelectedCinematic({
      cameraKeyframes: [
        ...selectedCinematic.cameraKeyframes,
        createKeyframe(previousKeyframe),
      ],
    });
    setStatus("Keyframe ajoutee localement.");
  }

  function handleRemoveKeyframe(keyframeIndex: number): void {
    if (!selectedCinematic) return;

    updateSelectedCinematic({
      cameraKeyframes: selectedCinematic.cameraKeyframes.filter(
        (_keyframe, index) => index !== keyframeIndex,
      ),
    });
    setStatus("Keyframe supprimee localement.");
  }

  useEffect(() => {
    let mounted = true;

    void loadCinematicManifest()
      .then((loadedManifest) => {
        if (!mounted) return;

        setManifest(loadedManifest);
        setSelectedCinematicId(loadedManifest?.cinematics[0]?.id ?? "");
        setStatus(
          loadedManifest
            ? `Manifeste charge: ${loadedManifest.cinematics.length} cinematics.`
            : "Manifeste cinematics introuvable ou invalide.",
        );
      })
      .catch((err: unknown) => {
        if (!mounted) return;

        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setStatus(message);
        setManifest(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      className="editor-cinematic-manifest-section"
      aria-labelledby="cinematic-manifest-heading"
    >
      <div className="editor-section-heading">
        <h3 id="cinematic-manifest-heading">Cinematics</h3>
        <span>{manifest?.cinematics.length ?? 0} items</span>
      </div>

      <div className="editor-cinematic-manifest-actions">
        <button type="button" onClick={() => void handleLoad()}>
          <RefreshCw size={14} aria-hidden="true" />
          Reload
        </button>
        <button type="button" disabled={!manifest} onClick={handleAddCinematic}>
          <Plus size={14} aria-hidden="true" />
          Add
        </button>
        <button
          type="button"
          disabled={!manifest || errors.length > 0 || isSaving}
          onClick={() => void handleSave()}
        >
          <Save size={14} aria-hidden="true" />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {manifest && (
        <label className="editor-cinematic-manifest-select">
          Cinematic
          <select
            value={selectedCinematic?.id ?? ""}
            onChange={(event) => setSelectedCinematicId(event.target.value)}
          >
            {manifest.cinematics.map((cinematic) => (
              <option key={cinematic.id} value={cinematic.id}>
                {cinematic.id || "Cinematic sans id"}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedCinematic && (
        <div className="editor-cinematic-manifest-form">
          <label>
            ID
            <input
              value={selectedCinematic.id}
              onChange={(event) =>
                updateSelectedCinematic(
                  { id: event.target.value },
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Timecode global optionnel
            <input
              type="number"
              min="0"
              step="0.1"
              value={selectedCinematic.timecode ?? ""}
              placeholder="Aucun"
              onChange={(event) => {
                const value = event.target.value.trim();
                updateSelectedCinematic({
                  timecode: value === "" ? undefined : Number(value),
                });
              }}
            />
          </label>

          <div className="editor-cinematic-keyframes">
            <div className="editor-cinematic-keyframes-heading">
              <strong>Camera keyframes</strong>
              <button type="button" onClick={handleAddKeyframe}>
                <Plus size={13} aria-hidden="true" />
                Add keyframe
              </button>
            </div>

            {selectedCinematic.cameraKeyframes.map(
              (keyframe, keyframeIndex) => (
                <div
                  className="editor-cinematic-keyframe"
                  key={`${selectedCinematic.id}-${keyframeIndex}`}
                >
                  <div className="editor-cinematic-keyframe-heading">
                    <strong>Keyframe {keyframeIndex + 1}</strong>
                    <button
                      type="button"
                      disabled={selectedCinematic.cameraKeyframes.length <= 2}
                      onClick={() => handleRemoveKeyframe(keyframeIndex)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Remove
                    </button>
                  </div>

                  <label>
                    Time
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={keyframe.time}
                      onChange={(event) =>
                        updateKeyframe(keyframeIndex, {
                          time: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <VectorInputs
                    label="Position"
                    value={keyframe.position}
                    onChange={(axis, value) =>
                      updateKeyframe(keyframeIndex, {
                        position: updateVector(keyframe.position, axis, value),
                      })
                    }
                  />

                  <VectorInputs
                    label="Target"
                    value={keyframe.target}
                    onChange={(axis, value) =>
                      updateKeyframe(keyframeIndex, {
                        target: updateVector(keyframe.target, axis, value),
                      })
                    }
                  />
                </div>
              ),
            )}
          </div>

          <button
            className="editor-cinematic-manifest-delete"
            type="button"
            onClick={() => handleRemoveCinematic(selectedCinematic.id)}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete cinematic
          </button>
        </div>
      )}

      <p className="editor-cinematic-manifest-status">{status}</p>
      <div
        className={`editor-cinematic-manifest-diagnostic ${errors.length === 0 ? "is-valid" : "is-invalid"}`}
      >
        <strong>
          {errors.length === 0
            ? "Manifeste local valide."
            : `${errors.length} erreur${errors.length > 1 ? "s" : ""} locale${errors.length > 1 ? "s" : ""}.`}
        </strong>
        {errors.length > 0 && (
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

interface VectorInputsProps {
  label: string;
  value: Vector3Tuple;
  onChange: (axis: VectorAxis, value: number) => void;
}

function VectorInputs({
  label,
  value,
  onChange,
}: VectorInputsProps): React.JSX.Element {
  return (
    <div className="editor-cinematic-vector-inputs">
      <span>{label}</span>
      {VECTOR_AXES.map(({ label: axisLabel, axis }) => (
        <label key={axisLabel}>
          {axisLabel}
          <input
            type="number"
            step="0.1"
            value={value[axis]}
            onChange={(event) => onChange(axis, Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );
}
