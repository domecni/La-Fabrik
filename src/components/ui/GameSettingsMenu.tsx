import { useEffect } from "react";
import { X } from "lucide-react";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import type {
  RepairRuntime,
  SubtitleLanguage,
} from "@/managers/stores/useSettingsStore";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function clearCookies(): void {
  document.cookie.split(";").forEach((cookie) => {
    const cookieName = cookie.split("=")[0]?.trim();
    if (!cookieName) return;

    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

interface VolumeSliderProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function VolumeSlider({
  id,
  label,
  value,
  onChange,
}: VolumeSliderProps): React.JSX.Element {
  return (
    <label className="game-settings-menu__slider" htmlFor={id}>
      <span>
        {label}
        <strong>{formatPercent(value)}</strong>
      </span>
      <input
        id={id}
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function GameSettingsMenu(): React.JSX.Element | null {
  const {
    isSettingsMenuOpen,
    musicVolume,
    sfxVolume,
    dialogueVolume,
    subtitlesEnabled,
    subtitleLanguage,
    repairRuntime,
    setMusicVolume,
    setSfxVolume,
    setDialogueVolume,
    setSettingsMenuOpen,
    setSubtitlesEnabled,
    setSubtitleLanguage,
    setRepairRuntime,
  } = useSettingsStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (!isSettingsMenuOpen) document.exitPointerLock();
        setSettingsMenuOpen(!isSettingsMenuOpen);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isSettingsMenuOpen, setSettingsMenuOpen]);

  if (!isSettingsMenuOpen) return null;

  const handleQuit = (): void => {
    clearCookies();
    window.location.assign("/");
  };

  return (
    <div className="game-settings-menu" role="dialog" aria-modal="true">
      <div className="game-settings-menu__panel">
        <header className="game-settings-menu__header">
          <div>
            <span>Pause</span>
            <h2>Options</h2>
          </div>
          <button
            className="game-settings-menu__close"
            type="button"
            onClick={() => setSettingsMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <section
          className="game-settings-menu__section"
          aria-labelledby="audio-settings-heading"
        >
          <h3 id="audio-settings-heading">Audio</h3>
          <VolumeSlider
            id="music-volume"
            label="Musique"
            value={musicVolume}
            onChange={setMusicVolume}
          />
          <VolumeSlider
            id="sfx-volume"
            label="Sound effects"
            value={sfxVolume}
            onChange={setSfxVolume}
          />
          <VolumeSlider
            id="dialogue-volume"
            label="Dialogue"
            value={dialogueVolume}
            onChange={setDialogueVolume}
          />
        </section>

        <section
          className="game-settings-menu__section"
          aria-labelledby="subtitle-settings-heading"
        >
          <h3 id="subtitle-settings-heading">Sous-titres</h3>
          <label className="game-settings-menu__checkbox">
            <input
              type="checkbox"
              checked={subtitlesEnabled}
              onChange={(event) => setSubtitlesEnabled(event.target.checked)}
            />
            Afficher sous-titres
          </label>

          <div
            className="game-settings-menu__choice-group"
            aria-label="Langue des sous-titres"
          >
            {(["fr", "en"] satisfies SubtitleLanguage[]).map((language) => (
              <button
                key={language}
                type="button"
                className={subtitleLanguage === language ? "active" : undefined}
                onClick={() => setSubtitleLanguage(language)}
                aria-pressed={subtitleLanguage === language}
              >
                {language === "fr" ? "Francais" : "English"}
              </button>
            ))}
          </div>
        </section>

        <section
          className="game-settings-menu__section"
          aria-labelledby="repair-settings-heading"
        >
          <h3 id="repair-settings-heading">Repair game</h3>
          <div className="game-settings-menu__choice-group game-settings-menu__choice-group--stacked">
            {(["js", "python"] satisfies RepairRuntime[]).map((runtime) => (
              <button
                key={runtime}
                type="button"
                className={repairRuntime === runtime ? "active" : undefined}
                onClick={() => setRepairRuntime(runtime)}
                aria-pressed={repairRuntime === runtime}
              >
                {runtime === "js"
                  ? "Repair game en JS (local)"
                  : "Repair game en Python (server)"}
              </button>
            ))}
          </div>
        </section>

        <button
          className="game-settings-menu__quit"
          type="button"
          onClick={handleQuit}
        >
          Quitter
        </button>
      </div>
    </div>
  );
}
