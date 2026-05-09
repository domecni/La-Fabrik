import { useEffect, useState } from "react";
import { Download, RefreshCw, Save } from "lucide-react";
import type { SubtitleLanguage } from "@/managers/stores/useSettingsStore";
import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueSpeaker,
  DialogueVoiceId,
} from "@/types/dialogues/dialogues";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { parseSrt } from "@/utils/subtitles/parseSrt";

interface SrtVoiceOption {
  id: DialogueVoiceId;
  label: DialogueSpeaker;
}

interface SrtDiagnostic {
  cueCount: number;
  expectedCueCount: number;
  errors: string[];
}

const SRT_VOICES: SrtVoiceOption[] = [
  { id: "narrateur", label: "Narrateur" },
  { id: "fermier", label: "Fermier" },
  { id: "electricienne", label: "Electricienne" },
];
const DEFAULT_SRT_VOICE: SrtVoiceOption = {
  id: "narrateur",
  label: "Narrateur",
};

const SRT_LANGUAGES: SubtitleLanguage[] = ["fr", "en"];
const SRT_TIME_LINE_PATTERN =
  /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/;

function getSrtPath(
  voice: DialogueVoiceId,
  language: SubtitleLanguage,
): string {
  return `/sounds/dialogue/subtitles/${language}/${voice}.srt`;
}

function createSrtTemplate(
  speaker: DialogueSpeaker,
  expectedCueIndexes: number[],
): string {
  const cueIndexes = expectedCueIndexes.length > 0 ? expectedCueIndexes : [1];

  return `${cueIndexes
    .map((cueIndex, index) => {
      const startTime = index * 3;
      const endTime = startTime + 2;

      return `${cueIndex}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${speaker}: Sous-titre ${cueIndex} a definir`;
    })
    .join("\n\n")}\n`;
}

function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)},000`;
}

function padTime(value: number): string {
  return value.toString().padStart(2, "0");
}

function getSrtDiagnostic(
  content: string,
  expectedCueIndexes: number[],
): SrtDiagnostic {
  const normalizedContent = content.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const blocks = normalizedContent
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean);
  const cues = parseSrt(content);
  const errors: string[] = [];
  const indexes = new Set<number>();

  if (blocks.length === 0) {
    errors.push("Le fichier SRT est vide.");
  }

  blocks.forEach((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const displayIndex = blockIndex + 1;
    const cueIndex = Number(lines[0]);

    if (lines.length < 3) {
      errors.push(
        `Bloc ${displayIndex}: il manque un index, un timecode ou un texte.`,
      );
      return;
    }

    if (!Number.isInteger(cueIndex)) {
      errors.push(`Bloc ${displayIndex}: l'index doit etre un nombre entier.`);
    } else if (indexes.has(cueIndex)) {
      errors.push(`Bloc ${displayIndex}: l'index ${cueIndex} est duplique.`);
    } else {
      indexes.add(cueIndex);
    }

    if (!SRT_TIME_LINE_PATTERN.test(lines[1] ?? "")) {
      errors.push(
        `Bloc ${displayIndex}: le timecode doit utiliser HH:MM:SS,mmm --> HH:MM:SS,mmm.`,
      );
    }
  });

  if (blocks.length > 0 && cues.length !== blocks.length) {
    errors.push(
      "Un ou plusieurs blocs ont une duree invalide ou un timecode illisible.",
    );
  }

  const cueIndexes = new Set(cues.map((cue) => cue.index));
  const missingCueIndexes = expectedCueIndexes.filter(
    (cueIndex) => !cueIndexes.has(cueIndex),
  );

  if (missingCueIndexes.length > 0) {
    errors.push(
      `Cues attendues par le manifeste manquantes: ${missingCueIndexes.join(", ")}.`,
    );
  }

  return {
    cueCount: cues.length,
    expectedCueCount: expectedCueIndexes.length,
    errors,
  };
}

function getExpectedCueIndexes(
  manifest: DialogueManifest | null,
  voice: DialogueVoiceId,
): number[] {
  return getExpectedDialogues(manifest, voice)
    .map((dialogue) => dialogue.subtitleCueIndex)
    .filter(
      (cueIndex, index, cueIndexes) => cueIndexes.indexOf(cueIndex) === index,
    )
    .sort((a, b) => a - b);
}

function getExpectedDialogues(
  manifest: DialogueManifest | null,
  voice: DialogueVoiceId,
): DialogueDefinition[] {
  if (!manifest) return [];

  return [...manifest.dialogues]
    .filter((dialogue) => dialogue.voice === voice)
    .sort((a, b) => a.subtitleCueIndex - b.subtitleCueIndex);
}

function downloadSrtFile(
  voice: DialogueVoiceId,
  language: SubtitleLanguage,
  content: string,
): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${voice}.${language}.srt`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function saveSrtFile(
  voice: DialogueVoiceId,
  language: SubtitleLanguage,
  content: string,
): Promise<void> {
  const response = await fetch("/api/save-srt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice, language, content }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Sauvegarde SRT impossible");
  }
}

export function EditorSrtPanel(): React.JSX.Element {
  const [voice, setVoice] = useState<DialogueVoiceId>("narrateur");
  const [language, setLanguage] = useState<SubtitleLanguage>("fr");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Chargement du SRT...");
  const [isSaving, setIsSaving] = useState(false);
  const [manifest, setManifest] = useState<DialogueManifest | null>(null);
  const selectedVoice =
    SRT_VOICES.find((item) => item.id === voice) ?? DEFAULT_SRT_VOICE;
  const expectedDialogues = getExpectedDialogues(manifest, voice);
  const expectedCueIndexes = getExpectedCueIndexes(manifest, voice);
  const diagnostic = getSrtDiagnostic(content, expectedCueIndexes);
  const isSrtValid = diagnostic.errors.length === 0;
  const srtTemplate = createSrtTemplate(
    selectedVoice.label,
    expectedCueIndexes,
  );
  const [selectedDialogueId, setSelectedDialogueId] = useState("");
  const selectedDialogue =
    expectedDialogues.find((dialogue) => dialogue.id === selectedDialogueId) ??
    expectedDialogues[0] ??
    null;

  async function handleSave(): Promise<void> {
    if (!isSrtValid) {
      setStatus("Corrige les erreurs SRT avant de sauvegarder.");
      return;
    }

    setIsSaving(true);
    setStatus("Sauvegarde du SRT...");

    try {
      await saveSrtFile(voice, language, content);
      setStatus(`Sauvegarde dans ${getSrtPath(voice, language)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(`${message}. Utilise Export SRT si le serveur dev est absent.`);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    void loadDialogueManifest()
      .then((loadedManifest) => {
        if (mounted) setManifest(loadedManifest);
      })
      .catch(() => {
        if (mounted) setManifest(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const srtPath = getSrtPath(voice, language);

    void fetch(srtPath)
      .then(async (response) => {
        if (!mounted) return;

        if (!response.ok) {
          setContent(srtTemplate);
          setStatus("Fichier absent, template local cree");
          return;
        }

        setContent(await response.text());
        setStatus(`Charge depuis ${srtPath}`);
      })
      .catch(() => {
        if (!mounted) return;
        setContent(srtTemplate);
        setStatus("Erreur de chargement, template local cree");
      });

    return () => {
      mounted = false;
    };
  }, [language, selectedVoice.label, srtTemplate, voice]);

  return (
    <section className="editor-srt-section" aria-labelledby="srt-heading">
      <div className="editor-section-heading">
        <h3 id="srt-heading">SRT</h3>
        <span>{language.toUpperCase()}</span>
      </div>

      <div className="editor-srt-controls">
        <label>
          Voix
          <select
            value={voice}
            onChange={(event) =>
              setVoice(event.target.value as DialogueVoiceId)
            }
          >
            {SRT_VOICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Langue
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as SubtitleLanguage)
            }
          >
            {SRT_LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="editor-srt-preview">
        <label>
          Dialogue audio
          <select
            value={selectedDialogue?.id ?? ""}
            onChange={(event) => setSelectedDialogueId(event.target.value)}
            disabled={expectedDialogues.length === 0}
          >
            {expectedDialogues.length === 0 && (
              <option value="">Aucun dialogue</option>
            )}
            {expectedDialogues.map((dialogue) => (
              <option key={dialogue.id} value={dialogue.id}>
                Cue {dialogue.subtitleCueIndex} - {dialogue.id}
              </option>
            ))}
          </select>
        </label>

        {selectedDialogue && (
          <div className="editor-srt-audio-card">
            <span>Cue {selectedDialogue.subtitleCueIndex}</span>
            <strong>{selectedDialogue.id}</strong>
            <audio
              key={selectedDialogue.audio}
              controls
              src={selectedDialogue.audio}
            />
          </div>
        )}
      </div>

      <textarea
        className="editor-srt-textarea"
        value={content}
        spellCheck={false}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        aria-label="SRT content"
      />

      <div className="editor-srt-actions">
        <button
          className="editor-action-button"
          type="button"
          onClick={() => setContent(srtTemplate)}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Template
        </button>
        <button
          className="editor-action-button editor-action-button-primary"
          type="button"
          disabled={isSaving || !isSrtValid}
          onClick={() => void handleSave()}
        >
          <Save size={15} aria-hidden="true" />
          {isSaving ? "Saving..." : "Save SRT"}
        </button>
        <button
          className="editor-action-button"
          type="button"
          onClick={() => downloadSrtFile(voice, language, content)}
        >
          <Download size={15} aria-hidden="true" />
          Export SRT
        </button>
      </div>

      <p className="editor-srt-status">{status}</p>
      <div
        className={`editor-srt-diagnostic ${isSrtValid ? "is-valid" : "is-invalid"}`}
      >
        <strong>
          {isSrtValid
            ? `${diagnostic.cueCount} cue${diagnostic.cueCount > 1 ? "s" : ""} valide${diagnostic.cueCount > 1 ? "s" : ""} / ${diagnostic.expectedCueCount} attendue${diagnostic.expectedCueCount > 1 ? "s" : ""}`
            : `${diagnostic.errors.length} erreur${diagnostic.errors.length > 1 ? "s" : ""} SRT`}
        </strong>
        {!isSrtValid && (
          <ul>
            {diagnostic.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
