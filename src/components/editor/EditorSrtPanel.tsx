import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, Save } from "lucide-react";
import type { SubtitleLanguage } from "@/types/settings/settings";
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
import { logger } from "@/utils/core/Logger";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import {
  parseSrt,
  parseSrtTime,
  parseSrtWithDiagnostics,
} from "@/utils/subtitles/parseSrt";

interface SrtVoiceOption {
  id: DialogueVoiceId;
  label: DialogueSpeaker;
}

interface SrtDiagnostic {
  cueCount: number;
  expectedCueCount: number;
  errors: string[];
}

interface TextRange {
  start: number;
  end: number;
}

interface DialogueValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

type CueTimeEdge = "start" | "end";
const CUE_NUDGE_SECONDS = 0.1;

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
  const safeSeconds = Math.max(0, totalSeconds);
  const totalMilliseconds = Math.round(safeSeconds * 1000);
  const milliseconds = totalMilliseconds % 1000;
  const totalWholeSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(totalWholeSeconds / 3600);
  const minutes = Math.floor((totalWholeSeconds % 3600) / 60);
  const seconds = totalWholeSeconds % 60;

  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)},${padMilliseconds(milliseconds)}`;
}

function formatPreviewTime(totalSeconds: number): string {
  return `${Math.max(0, totalSeconds).toFixed(1)}s`;
}

function padTime(value: number): string {
  return value.toString().padStart(2, "0");
}

function padMilliseconds(value: number): string {
  return value.toString().padStart(3, "0");
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
  const { cues, diagnostics } = parseSrtWithDiagnostics(content);
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

  for (const diagnostic of diagnostics) {
    errors.push(`Bloc ${diagnostic.blockIndex + 1}: ${diagnostic.reason}.`);
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
    .flatMap((dialogue) => getDialogueCueIndices(dialogue))
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
    .sort((a, b) => {
      const aIndex = getDialogueFirstCueIndex(a) ?? 0;
      const bIndex = getDialogueFirstCueIndex(b) ?? 0;
      return aIndex - bIndex;
    });
}

function findCueBlockRange(
  content: string,
  cueIndex: number,
): TextRange | null {
  const normalizedContent = content.replace(/\r/g, "");
  const cuePattern = new RegExp(`(^|\\n)${cueIndex}\\n`, "m");
  const match = normalizedContent.match(cuePattern);

  if (!match || match.index === undefined) return null;

  const start = match.index + (match[1] ? 1 : 0);
  const nextBlockIndex = normalizedContent.indexOf("\n\n", start);
  const end = nextBlockIndex === -1 ? normalizedContent.length : nextBlockIndex;

  return { start, end };
}

function updateCueTimecode(
  content: string,
  cueIndex: number,
  edge: CueTimeEdge,
  time: number,
): string | null {
  const range = findCueBlockRange(content, cueIndex);
  if (!range) return null;

  const block = content.slice(range.start, range.end);
  const lines = block.split("\n");
  const timecodeLine = lines[1];
  if (!timecodeLine) return null;

  const [start, end] = timecodeLine.split(" --> ");
  if (!start || !end) return null;

  lines[1] =
    edge === "start"
      ? `${formatSrtTime(time)} --> ${end}`
      : `${start} --> ${formatSrtTime(time)}`;

  return `${content.slice(0, range.start)}${lines.join("\n")}${content.slice(range.end)}`;
}

function nudgeCueTimecode(
  content: string,
  cueIndex: number,
  delta: number,
): string | null {
  const range = findCueBlockRange(content, cueIndex);
  if (!range) return null;

  const block = content.slice(range.start, range.end);
  const lines = block.split("\n");
  const timecodeLine = lines[1];
  if (!timecodeLine) return null;

  const [start, end] = timecodeLine.split(" --> ");
  if (!start || !end) return null;

  const startTime = parseSrtTime(start);
  const endTime = parseSrtTime(end);
  if (startTime === null || endTime === null) return null;

  const nextStartTime = Math.max(0, startTime + delta);
  const nextEndTime = Math.max(nextStartTime + 0.001, endTime + delta);
  lines[1] = `${formatSrtTime(nextStartTime)} --> ${formatSrtTime(nextEndTime)}`;

  return `${content.slice(0, range.start)}${lines.join("\n")}${content.slice(range.end)}`;
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

async function validateDialogueAssets(): Promise<DialogueValidationResult> {
  const response = await fetch("/api/validate-dialogues");
  const body = (await response.json().catch(() => null)) as
    | Partial<DialogueValidationResult>
    | { error?: string }
    | null;

  if (!body) {
    throw new Error("Validation dialogues impossible");
  }

  if (
    "valid" in body &&
    typeof body.valid === "boolean" &&
    Array.isArray(body.errors) &&
    Array.isArray(body.warnings)
  ) {
    return {
      valid: body.valid,
      errors: body.errors.filter((item) => typeof item === "string"),
      warnings: body.warnings.filter((item) => typeof item === "string"),
    };
  }

  throw new Error(
    "error" in body && body.error
      ? body.error
      : "Validation dialogues impossible",
  );
}

export function EditorSrtPanel(): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [voice, setVoice] = useState<DialogueVoiceId>("narrateur");
  const [language, setLanguage] = useState<SubtitleLanguage>("fr");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Chargement du SRT...");
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingDialogues, setIsValidatingDialogues] = useState(false);
  const [dialogueValidationResult, setDialogueValidationResult] =
    useState<DialogueValidationResult | null>(null);
  const [manifest, setManifest] = useState<DialogueManifest | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [selectedDialogueId, setSelectedDialogueId] = useState("");
  const selectedVoice =
    SRT_VOICES.find((item) => item.id === voice) ?? DEFAULT_SRT_VOICE;
  const expectedDialogues = getExpectedDialogues(manifest, voice);
  const expectedCueIndexes = getExpectedCueIndexes(manifest, voice);
  const parsedCues = parseSrt(content);
  const activeCue =
    parsedCues.find(
      (cue) =>
        audioCurrentTime >= cue.startTime && audioCurrentTime < cue.endTime,
    ) ?? null;
  const diagnostic = getSrtDiagnostic(content, expectedCueIndexes);
  const isSrtValid = diagnostic.errors.length === 0;
  const dialogueValidationClass = dialogueValidationResult
    ? dialogueValidationResult.valid
      ? "is-valid"
      : "is-invalid"
    : "is-idle";
  const srtTemplate = createSrtTemplate(
    selectedVoice.label,
    expectedCueIndexes,
  );
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

  async function handleValidateDialogues(): Promise<void> {
    setIsValidatingDialogues(true);
    setDialogueValidationResult(null);

    try {
      const result = await validateDialogueAssets();
      setDialogueValidationResult(result);
      setStatus(
        result.valid
          ? "Validation dialogues terminee."
          : "Validation dialogues terminee avec erreurs.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(`${message}. Verifie que le serveur Vite est lance.`);
    } finally {
      setIsValidatingDialogues(false);
    }
  }

  function handleJumpToCue(cueIndex: number): void {
    const range = findCueBlockRange(content, cueIndex);

    if (!range || !textareaRef.current) {
      setStatus(`Cue ${cueIndex} introuvable dans le SRT.`);
      return;
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(range.start, range.end);
    setStatus(`Cue ${cueIndex} selectionnee dans le SRT.`);
  }

  function handleSetCueTime(cueIndex: number, edge: CueTimeEdge): void {
    const updatedContent = updateCueTimecode(
      content,
      cueIndex,
      edge,
      audioCurrentTime,
    );

    if (!updatedContent) {
      setStatus(`Cue ${cueIndex} introuvable ou timecode invalide.`);
      return;
    }

    setContent(updatedContent);
    setStatus(
      `Cue ${cueIndex}: ${edge === "start" ? "debut" : "fin"} place a ${formatSrtTime(audioCurrentTime)}.`,
    );
  }

  function handleNudgeCue(cueIndex: number, delta: number): void {
    const updatedContent = nudgeCueTimecode(content, cueIndex, delta);

    if (!updatedContent) {
      setStatus(`Cue ${cueIndex} introuvable ou timecode invalide.`);
      return;
    }

    setContent(updatedContent);
    setStatus(
      `Cue ${cueIndex} decalee de ${delta > 0 ? "+" : ""}${delta.toFixed(1)}s.`,
    );
  }

  useEffect(() => {
    let mounted = true;

    void loadDialogueManifest()
      .then((loadedManifest) => {
        if (mounted) setManifest(loadedManifest);
      })
      .catch((error) => {
        if (!mounted) return;

        setManifest(null);
        setStatus("Erreur de chargement du manifeste dialogues");
        logger.error("EditorSrt", "Failed to load dialogue manifest", {
          error: error instanceof Error ? error : String(error),
        });
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
      .catch((error: unknown) => {
        if (!mounted) return;
        setContent(srtTemplate);
        setStatus(
          `Erreur de chargement, template local cree: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        );
        logger.warn("EditorSrt", "Falling back to local SRT template", {
          srtPath,
          error: error instanceof Error ? error : String(error),
        });
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
            onChange={(event) => {
              const selectedVoice = SRT_VOICES.find(
                (item) => item.id === event.target.value,
              );
              if (selectedVoice) {
                setVoice(selectedVoice.id);
              }
            }}
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
            onChange={(event) => {
              const selectedLanguage = SRT_LANGUAGES.find(
                (item) => item === event.target.value,
              );
              if (selectedLanguage) {
                setLanguage(selectedLanguage);
              }
            }}
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
                Cue {getDialogueFirstCueIndex(dialogue) ?? "?"} - {dialogue.id}
              </option>
            ))}
          </select>
        </label>

        {selectedDialogue && (
          <div className="editor-srt-audio-card">
            <span>Cue {getDialogueFirstCueIndex(selectedDialogue) ?? "?"}</span>
            <strong>{selectedDialogue.id}</strong>
            <audio
              key={selectedDialogue.audio}
              controls
              src={selectedDialogue.audio}
              onLoadedMetadata={() => setAudioCurrentTime(0)}
              onTimeUpdate={(event) =>
                setAudioCurrentTime(event.currentTarget.currentTime)
              }
            />
            <div className="editor-srt-active-cue">
              <span>Temps audio: {formatPreviewTime(audioCurrentTime)}</span>
              {activeCue ? (
                <p>
                  <strong>Cue {activeCue.index}</strong> {activeCue.text}
                </p>
              ) : (
                <p>Aucune cue active a ce moment.</p>
              )}
            </div>
            <div className="editor-srt-time-actions">
              <button
                type="button"
                disabled={
                  getDialogueFirstCueIndex(selectedDialogue) === undefined
                }
                onClick={() => {
                  const cueIndex = getDialogueFirstCueIndex(selectedDialogue);
                  if (cueIndex !== undefined)
                    handleSetCueTime(cueIndex, "start");
                }}
              >
                Set start
              </button>
              <button
                type="button"
                disabled={
                  getDialogueFirstCueIndex(selectedDialogue) === undefined
                }
                onClick={() => {
                  const cueIndex = getDialogueFirstCueIndex(selectedDialogue);
                  if (cueIndex !== undefined) handleSetCueTime(cueIndex, "end");
                }}
              >
                Set end
              </button>
              <button
                type="button"
                disabled={
                  getDialogueFirstCueIndex(selectedDialogue) === undefined
                }
                onClick={() => {
                  const cueIndex = getDialogueFirstCueIndex(selectedDialogue);
                  if (cueIndex !== undefined)
                    handleNudgeCue(cueIndex, -CUE_NUDGE_SECONDS);
                }}
              >
                -100ms
              </button>
              <button
                type="button"
                disabled={
                  getDialogueFirstCueIndex(selectedDialogue) === undefined
                }
                onClick={() => {
                  const cueIndex = getDialogueFirstCueIndex(selectedDialogue);
                  if (cueIndex !== undefined)
                    handleNudgeCue(cueIndex, CUE_NUDGE_SECONDS);
                }}
              >
                +100ms
              </button>
            </div>
            <button
              className="editor-srt-jump-button"
              type="button"
              disabled={
                getDialogueFirstCueIndex(selectedDialogue) === undefined
              }
              onClick={() => {
                const cueIndex = getDialogueFirstCueIndex(selectedDialogue);
                if (cueIndex !== undefined) handleJumpToCue(cueIndex);
              }}
            >
              Aller a la cue {getDialogueFirstCueIndex(selectedDialogue) ?? "?"}
            </button>
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
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
      <div className={`editor-dialogue-validation ${dialogueValidationClass}`}>
        <div className="editor-dialogue-validation__heading">
          <div>
            <strong>Manifeste dialogues</strong>
            <span>Audio, SRT FR et cues references</span>
          </div>
          <button
            type="button"
            disabled={isValidatingDialogues}
            onClick={() => void handleValidateDialogues()}
          >
            <RefreshCw size={14} aria-hidden="true" />
            {isValidatingDialogues ? "Validation..." : "Validate"}
          </button>
        </div>

        {dialogueValidationResult && (
          <div className="editor-dialogue-validation__result">
            <p>
              {dialogueValidationResult.valid
                ? "Manifeste valide."
                : `${dialogueValidationResult.errors.length} erreur${dialogueValidationResult.errors.length > 1 ? "s" : ""} detectee${dialogueValidationResult.errors.length > 1 ? "s" : ""}.`}
              {dialogueValidationResult.warnings.length > 0 &&
                ` ${dialogueValidationResult.warnings.length} warning${dialogueValidationResult.warnings.length > 1 ? "s" : ""}.`}
            </p>
            {dialogueValidationResult.errors.length > 0 && (
              <ul className="editor-dialogue-validation__errors">
                {dialogueValidationResult.errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            )}
            {dialogueValidationResult.warnings.length > 0 && (
              <ul className="editor-dialogue-validation__warnings">
                {dialogueValidationResult.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
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
