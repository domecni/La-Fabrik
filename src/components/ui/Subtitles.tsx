import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import type { DialogueSpeaker } from "@/types/dialogues/dialogues";

export type SubtitleSpeaker = DialogueSpeaker;

interface SubtitlesProps {
  speaker?: SubtitleSpeaker | null;
  text?: string | null;
}

export function Subtitles({
  speaker = null,
  text = null,
}: SubtitlesProps): React.JSX.Element | null {
  const subtitlesEnabled = useSettingsStore((state) => state.subtitlesEnabled);
  const activeSubtitle = useSubtitleStore((state) => state.activeSubtitle);
  const subtitleSpeaker = speaker ?? activeSubtitle?.speaker ?? null;
  const content = (text ?? activeSubtitle?.text)?.trim();

  if (!subtitlesEnabled || !content) return null;

  return (
    <div className="subtitles" aria-live="polite">
      <p>
        {subtitleSpeaker ? (
          <span
            className={`subtitles__speaker subtitles__speaker--${subtitleSpeaker.toLowerCase()}`}
          >
            {subtitleSpeaker}:
          </span>
        ) : null}
        {content}
      </p>
    </div>
  );
}
