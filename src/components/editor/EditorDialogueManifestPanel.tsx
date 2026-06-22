import { useEffect, useRef, useState } from "react";
import { Play, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { assetUrl } from "@/utils/assetUrl";
import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueSpeaker,
  DialogueVoiceId,
} from "@/types/dialogues/dialogues";
import {
  getDialogueCueIndices,
  getDialogueFirstCueIndex,
} from "@/types/dialogues/dialogues";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import { parseSrt } from "@/utils/subtitles/parseSrt";

const DEFAULT_VOICE: DialogueVoiceId = "narrateur";
type DialoguePatch = Partial<Omit<DialogueDefinition, "timecode">> & {
  timecode?: number | undefined;
};

function createDialogue(
  index: number,
  manifest: DialogueManifest,
  voice: DialogueVoiceId,
): DialogueDefinition {
  return {
    id: `new_dialogue_${index}`,
    voice,
    audio: assetUrl(`/sounds/dialogue/new_dialogue_${index}.mp3`),
    subtitleCueIndex: getNextCueIndex(manifest, voice),
  };
}

function getNextCueIndex(
  manifest: DialogueManifest,
  voice: DialogueVoiceId,
): number {
  const cueIndexes = manifest.dialogues
    .filter((dialogue) => dialogue.voice === voice)
    .flatMap((dialogue) => getDialogueCueIndices(dialogue));

  return Math.max(0, ...cueIndexes) + 1;
}

function getVoiceSpeaker(
  manifest: DialogueManifest,
  voice: DialogueVoiceId,
): DialogueSpeaker {
  return (
    manifest.voices.find((item) => item.id === voice)?.speaker ?? "Narrateur"
  );
}

function getFrenchSrtPath(voice: DialogueVoiceId): string {
  return assetUrl(`/sounds/dialogue/subtitles/fr/${voice}.srt`);
}

function createSrtCueBlock(cueIndex: number, speaker: DialogueSpeaker): string {
  return `${cueIndex}\n00:00:00,000 --> 00:00:02,000\n${speaker}: Nouveau sous-titre ${cueIndex} a definir`;
}

function appendSrtCueIfMissing(
  content: string,
  cueIndex: number,
  speaker: DialogueSpeaker,
): string {
  const cues = parseSrt(content);
  if (cues.some((cue) => cue.index === cueIndex)) return content;

  const trimmedContent = content.trim();
  const cueBlock = createSrtCueBlock(cueIndex, speaker);
  return trimmedContent
    ? `${trimmedContent}\n\n${cueBlock}\n`
    : `${cueBlock}\n`;
}

async function saveSrtFile(
  voice: DialogueVoiceId,
  content: string,
): Promise<void> {
  const response = await fetch("/api/save-srt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice, language: "fr", content }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Sauvegarde SRT impossible");
  }
}

async function createFrenchSrtCue(
  manifest: DialogueManifest,
  dialogue: DialogueDefinition,
): Promise<void> {
  const firstCueIndex = getDialogueFirstCueIndex(dialogue);
  if (firstCueIndex === undefined) return;

  const srtPath = getFrenchSrtPath(dialogue.voice);
  const response = await fetch(srtPath);
  const content = response.ok ? await response.text() : "";
  const nextContent = appendSrtCueIfMissing(
    content,
    firstCueIndex,
    getVoiceSpeaker(manifest, dialogue.voice),
  );

  await saveSrtFile(dialogue.voice, nextContent);
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

    const cueIndices = getDialogueCueIndices(dialogue);
    if (cueIndices.length === 0) {
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
  };

  if (patch.subtitleCueIndex !== undefined) {
    nextDialogue.subtitleCueIndex = patch.subtitleCueIndex;
  } else if (dialogue.subtitleCueIndex !== undefined) {
    nextDialogue.subtitleCueIndex = dialogue.subtitleCueIndex;
  }

  if (dialogue.subtitleCueIndices !== undefined) {
    nextDialogue.subtitleCueIndices = dialogue.subtitleCueIndices;
  }

  if ("timecode" in patch) {
    if (patch.timecode !== undefined) nextDialogue.timecode = patch.timecode;
  } else if (dialogue.timecode !== undefined) {
    nextDialogue.timecode = dialogue.timecode;
  }

  return nextDialogue;
}

export function EditorDialogueManifestPanel(): React.JSX.Element {
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [manifest, setManifest] = useState<DialogueManifest | null>(null);
  const [selectedDialogueId, setSelectedDialogueId] = useState("");
  const [status, setStatus] = useState("Chargement du manifeste...");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreatingSrtCue, setIsCreatingSrtCue] = useState(false);
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

  async function handleAddDialogue(): Promise<void> {
    if (!manifest) return;

    const voice = selectedDialogue?.voice ?? DEFAULT_VOICE;
    const dialogue = createDialogue(
      manifest.dialogues.length + 1,
      manifest,
      voice,
    );
    const nextManifest = {
      ...manifest,
      dialogues: [...manifest.dialogues, dialogue],
    };

    setManifest(nextManifest);
    setSelectedDialogueId(dialogue.id);
    setIsCreatingSrtCue(true);
    setStatus("Nouveau dialogue ajoute localement. Creation de la cue FR...");

    try {
      await createFrenchSrtCue(nextManifest, dialogue);
      const cueIndex = getDialogueFirstCueIndex(dialogue) ?? "?";
      setStatus(
        `Nouveau dialogue ajoute avec cue FR ${cueIndex}. Sauvegarde le manifeste pour le garder.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(
        `Dialogue ajoute localement, mais cue FR non creee: ${message}`,
      );
    } finally {
      setIsCreatingSrtCue(false);
    }
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

  async function handlePreviewDialogue(): Promise<void> {
    if (!manifest || !selectedDialogue) return;
    if (errors.length > 0) {
      setStatus("Corrige les erreurs avant de lancer la preview.");
      return;
    }

    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setIsPreviewing(true);
    setStatus(`Preview dialogue: ${selectedDialogue.id}`);

    try {
      const audio = await playDialogueById(manifest, selectedDialogue.id);
      previewAudioRef.current = audio;

      if (!audio) {
        setStatus("Dialogue introuvable pour la preview.");
        return;
      }

      const handleFinish = (): void => {
        audio.removeEventListener("ended", handleFinish);
        audio.removeEventListener("pause", handleFinish);
        if (previewAudioRef.current === audio) previewAudioRef.current = null;
        setIsPreviewing(false);
      };

      audio.addEventListener("ended", handleFinish);
      audio.addEventListener("pause", handleFinish);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(message);
      setIsPreviewing(false);
    }
  }

  async function handleCreateFrenchSrtCue(): Promise<void> {
    if (!manifest || !selectedDialogue) return;

    const cueIndex = getDialogueFirstCueIndex(selectedDialogue) ?? "?";
    setIsCreatingSrtCue(true);
    setStatus(`Creation de la cue FR ${cueIndex}...`);

    try {
      await createFrenchSrtCue(manifest, selectedDialogue);
      setStatus(`Cue FR ${cueIndex} prete.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(message);
    } finally {
      setIsCreatingSrtCue(false);
    }
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
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
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
        <button
          type="button"
          disabled={!manifest || isCreatingSrtCue}
          onClick={() => void handleAddDialogue()}
        >
          <Plus size={14} aria-hidden="true" />
          {isCreatingSrtCue ? "Adding..." : "Add"}
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
              onChange={(event) => {
                const selectedVoice = voices.find(
                  (voice) => voice.id === event.target.value,
                );
                if (!selectedVoice) return;

                updateSelectedDialogue({ voice: selectedVoice.id });
              }}
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
              value={getDialogueFirstCueIndex(selectedDialogue) ?? ""}
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
            className="editor-dialogue-manifest-srt-cue"
            type="button"
            disabled={isCreatingSrtCue}
            onClick={() => void handleCreateFrenchSrtCue()}
          >
            <Plus size={14} aria-hidden="true" />
            {isCreatingSrtCue ? "Creating..." : "Create FR SRT cue"}
          </button>

          <button
            className="editor-dialogue-manifest-preview"
            type="button"
            disabled={errors.length > 0 || isPreviewing}
            onClick={() => void handlePreviewDialogue()}
          >
            <Play size={14} aria-hidden="true" />
            {isPreviewing ? "Playing..." : "Preview dialogue"}
          </button>

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
