import { useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueVoiceId,
} from "@/types/dialogues/dialogues";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";

const DEFAULT_VOICE: DialogueVoiceId = "narrateur";
type DialoguePatch = Partial<Omit<DialogueDefinition, "timecode">> & {
  timecode?: number | undefined;
};

function createDialogue(index: number): DialogueDefinition {
  return {
    id: `new_dialogue_${index}`,
    voice: DEFAULT_VOICE,
    audio: "/sounds/dialogue/new_dialogue.mp3",
    subtitleCueIndex: 1,
  };
}

function getManifestErrors(manifest: DialogueManifest | null): string[] {
  if (!manifest) return ["Manifeste absent."];

  const errors: string[] = [];
  const ids = new Set<string>();

  manifest.dialogues.forEach((dialogue, index) => {
    const label = dialogue.id || `Dialogue ${index + 1}`;

    if (!dialogue.id.trim()) errors.push(`${label}: id obligatoire.`);
    if (ids.has(dialogue.id)) errors.push(`${label}: id duplique.`);
    ids.add(dialogue.id);

    if (!dialogue.audio.startsWith("/sounds/dialogue/")) {
      errors.push(`${label}: audio doit commencer par /sounds/dialogue/.`);
    }

    if (!Number.isInteger(dialogue.subtitleCueIndex)) {
      errors.push(`${label}: cue SRT invalide.`);
    }

    if (
      dialogue.timecode !== undefined &&
      (!Number.isFinite(dialogue.timecode) || dialogue.timecode < 0)
    ) {
      errors.push(`${label}: timecode invalide.`);
    }
  });

  return errors;
}

async function saveDialogueManifest(manifest: DialogueManifest): Promise<void> {
  const response = await fetch("/api/save-dialogues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manifest),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Sauvegarde du manifeste impossible");
  }
}

function getPatchedDialogue(
  dialogue: DialogueDefinition,
  patch: DialoguePatch,
): DialogueDefinition {
  const nextDialogue: DialogueDefinition = {
    id: patch.id ?? dialogue.id,
    voice: patch.voice ?? dialogue.voice,
    audio: patch.audio ?? dialogue.audio,
    subtitleCueIndex: patch.subtitleCueIndex ?? dialogue.subtitleCueIndex,
  };

  if ("timecode" in patch) {
    if (patch.timecode !== undefined) nextDialogue.timecode = patch.timecode;
  } else if (dialogue.timecode !== undefined) {
    nextDialogue.timecode = dialogue.timecode;
  }

  return nextDialogue;
}

export function EditorDialogueManifestPanel(): React.JSX.Element {
  const [manifest, setManifest] = useState<DialogueManifest | null>(null);
  const [selectedDialogueId, setSelectedDialogueId] = useState("");
  const [status, setStatus] = useState("Chargement du manifeste...");
  const [isSaving, setIsSaving] = useState(false);
  const errors = getManifestErrors(manifest);
  const selectedDialogue =
    manifest?.dialogues.find(
      (dialogue) => dialogue.id === selectedDialogueId,
    ) ??
    manifest?.dialogues[0] ??
    null;
  const voices = manifest?.voices ?? [];

  async function handleLoad(): Promise<void> {
    setStatus("Chargement du manifeste...");

    try {
      const loadedManifest = await loadDialogueManifest();
      setManifest(loadedManifest);
      setSelectedDialogueId(loadedManifest?.dialogues[0]?.id ?? "");
      setStatus(
        loadedManifest
          ? `Manifeste charge: ${loadedManifest.dialogues.length} dialogues.`
          : "Manifeste introuvable ou invalide.",
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
    setStatus("Sauvegarde du manifeste...");

    try {
      await saveDialogueManifest(manifest);
      setStatus(
        "Manifeste sauvegarde dans public/sounds/dialogue/dialogues.json.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddDialogue(): void {
    if (!manifest) return;

    const dialogue = createDialogue(manifest.dialogues.length + 1);
    setManifest({
      ...manifest,
      dialogues: [...manifest.dialogues, dialogue],
    });
    setSelectedDialogueId(dialogue.id);
    setStatus("Nouveau dialogue ajoute localement.");
  }

  function handleRemoveDialogue(dialogueId: string): void {
    if (!manifest) return;

    const nextDialogues = manifest.dialogues.filter(
      (dialogue) => dialogue.id !== dialogueId,
    );
    setManifest({ ...manifest, dialogues: nextDialogues });
    setSelectedDialogueId(nextDialogues[0]?.id ?? "");
    setStatus("Dialogue supprime localement.");
  }

  function updateSelectedDialogue(
    patch: DialoguePatch,
    nextId = selectedDialogueId,
  ): void {
    if (!manifest || !selectedDialogue) return;

    setManifest({
      ...manifest,
      dialogues: manifest.dialogues.map((dialogue) =>
        dialogue.id === selectedDialogue.id
          ? getPatchedDialogue(dialogue, patch)
          : dialogue,
      ),
    });
    setSelectedDialogueId(nextId);
  }

  useEffect(() => {
    let mounted = true;

    void loadDialogueManifest()
      .then((loadedManifest) => {
        if (!mounted) return;

        setManifest(loadedManifest);
        setSelectedDialogueId(loadedManifest?.dialogues[0]?.id ?? "");
        setStatus(
          loadedManifest
            ? `Manifeste charge: ${loadedManifest.dialogues.length} dialogues.`
            : "Manifeste introuvable ou invalide.",
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
      className="editor-dialogue-manifest-section"
      aria-labelledby="dialogue-manifest-heading"
    >
      <div className="editor-section-heading">
        <h3 id="dialogue-manifest-heading">Dialogues</h3>
        <span>{manifest?.dialogues.length ?? 0} items</span>
      </div>

      <div className="editor-dialogue-manifest-actions">
        <button type="button" onClick={() => void handleLoad()}>
          <RefreshCw size={14} aria-hidden="true" />
          Reload
        </button>
        <button type="button" disabled={!manifest} onClick={handleAddDialogue}>
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
        <label className="editor-dialogue-manifest-select">
          Dialogue
          <select
            value={selectedDialogue?.id ?? ""}
            onChange={(event) => setSelectedDialogueId(event.target.value)}
          >
            {manifest.dialogues.map((dialogue) => (
              <option key={dialogue.id} value={dialogue.id}>
                {dialogue.id || "Dialogue sans id"}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedDialogue && (
        <div className="editor-dialogue-manifest-form">
          <label>
            ID
            <input
              value={selectedDialogue.id}
              onChange={(event) =>
                updateSelectedDialogue(
                  { id: event.target.value },
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Voix
            <select
              value={selectedDialogue.voice}
              onChange={(event) =>
                updateSelectedDialogue({
                  voice: event.target.value as DialogueVoiceId,
                })
              }
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.speaker}
                </option>
              ))}
            </select>
          </label>

          <label>
            Audio
            <input
              value={selectedDialogue.audio}
              onChange={(event) =>
                updateSelectedDialogue({ audio: event.target.value })
              }
            />
          </label>

          <label>
            Cue SRT
            <input
              type="number"
              min="1"
              step="1"
              value={selectedDialogue.subtitleCueIndex}
              onChange={(event) =>
                updateSelectedDialogue({
                  subtitleCueIndex: Math.max(1, Number(event.target.value)),
                })
              }
            />
          </label>

          <label>
            Timecode global optionnel
            <input
              type="number"
              min="0"
              step="0.1"
              value={selectedDialogue.timecode ?? ""}
              placeholder="Aucun"
              onChange={(event) => {
                const value = event.target.value.trim();
                updateSelectedDialogue({
                  timecode: value === "" ? undefined : Number(value),
                });
              }}
            />
          </label>

          <button
            className="editor-dialogue-manifest-delete"
            type="button"
            onClick={() => handleRemoveDialogue(selectedDialogue.id)}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete dialogue
          </button>
        </div>
      )}

      <p className="editor-dialogue-manifest-status">{status}</p>
      <div
        className={`editor-dialogue-manifest-diagnostic ${errors.length === 0 ? "is-valid" : "is-invalid"}`}
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
