import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  Captions,
  Gauge,
  LogOut,
  Music2,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import {
  GRAPHICS_PRESET_KEYS,
  GRAPHICS_PRESETS,
  type GraphicsPreset,
} from "@/data/world/graphicsConfig";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import type { SubtitleLanguage } from "@/types/settings/settings";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

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
  icon: ReactNode;
  value: number;
  onChange: (value: number) => void;
}

function VolumeSlider({
  id,
  label,
  icon,
  value,
  onChange,
}: VolumeSliderProps): React.JSX.Element {
  return (
    <label className="game-settings-menu__slider" htmlFor={id}>
      <span>
        <em>
          {icon}
          {label}
        </em>
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

function formatChunkDistance(distance: number): string {
  return `${distance}m`;
}

interface GraphicsPresetButtonProps {
  active: boolean;
  preset: GraphicsPreset;
  onSelect: (preset: GraphicsPreset) => void;
}

function GraphicsPresetButton({
  active,
  preset,
  onSelect,
}: GraphicsPresetButtonProps): React.JSX.Element {
  const config = GRAPHICS_PRESETS[preset];
  const lodLabel = config.forceLodModels
    ? "LOD forcé"
    : `HD ${config.lodHighDetailDistance}m`;

  return (
    <button
      type="button"
      className={active ? "active" : undefined}
      onClick={() => onSelect(preset)}
      aria-pressed={active}
    >
      <span>{config.label}</span>
      <small>
        {formatChunkDistance(config.chunkLoadRadius)} · {lodLabel} ·{" "}
        {config.fogEnabled ? "Fog" : "Clear"}
      </small>
    </button>
  );
}

export function GameSettingsMenu(): React.JSX.Element | null {
  const resetGame = useGameStore((state) => state.resetGame);
  const graphicsPreset = useWorldSettingsStore(
    (state) => state.graphics.preset,
  );
  const setGraphicsPreset = useWorldSettingsStore(
    (state) => state.setGraphicsPreset,
  );
  const {
    isSettingsMenuOpen,
    musicVolume,
    sfxVolume,
    dialogueVolume,
    subtitlesEnabled,
    subtitleLanguage,
    setMusicVolume,
    setSfxVolume,
    setDialogueVolume,
    setSettingsMenuOpen,
    setSubtitlesEnabled,
    setSubtitleLanguage,
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

  const handleRestart = (): void => {
    resetGame();
    window.location.reload();
  };

  const showDebugRestart = isDebugEnabled();

  return (
    <div className="game-settings-menu" role="dialog" aria-modal="true">
      <div className="game-settings-menu__panel">
        <header className="game-settings-menu__header">
          <div>
            <span>La Fabrik</span>
            <h2>Pause</h2>
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

        <div className="game-settings-menu__grid">
          <section
            className="game-settings-menu__section game-settings-menu__section--wide"
            aria-labelledby="graphics-settings-heading"
          >
            <div className="game-settings-menu__section-title">
              <Gauge size={16} aria-hidden="true" />
              <h3 id="graphics-settings-heading">Performance</h3>
            </div>
            <div
              className="game-settings-menu__choice-group game-settings-menu__choice-group--presets"
              aria-label="Preset graphique"
            >
              {GRAPHICS_PRESET_KEYS.map((preset) => (
                <GraphicsPresetButton
                  key={preset}
                  preset={preset}
                  active={graphicsPreset === preset}
                  onSelect={setGraphicsPreset}
                />
              ))}
            </div>
          </section>

          <section
            className="game-settings-menu__section"
            aria-labelledby="audio-settings-heading"
          >
            <div className="game-settings-menu__section-title">
              <Volume2 size={16} aria-hidden="true" />
              <h3 id="audio-settings-heading">Audio</h3>
            </div>
            <VolumeSlider
              id="music-volume"
              icon={<Music2 size={14} aria-hidden="true" />}
              label="Musique"
              value={musicVolume}
              onChange={setMusicVolume}
            />
            <VolumeSlider
              id="sfx-volume"
              icon={<Volume2 size={14} aria-hidden="true" />}
              label="Effets"
              value={sfxVolume}
              onChange={setSfxVolume}
            />
            <VolumeSlider
              id="dialogue-volume"
              icon={<Captions size={14} aria-hidden="true" />}
              label="Dialogue"
              value={dialogueVolume}
              onChange={setDialogueVolume}
            />
          </section>

          <section
            className="game-settings-menu__section"
            aria-labelledby="subtitle-settings-heading"
          >
            <div className="game-settings-menu__section-title">
              <Captions size={16} aria-hidden="true" />
              <h3 id="subtitle-settings-heading">Sous-titres</h3>
            </div>
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
                  className={
                    subtitleLanguage === language ? "active" : undefined
                  }
                  onClick={() => setSubtitleLanguage(language)}
                  aria-pressed={subtitleLanguage === language}
                >
                  <span>{language === "fr" ? "Français" : "English"}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {showDebugRestart ? (
          <button
            className="game-settings-menu__restart"
            type="button"
            onClick={handleRestart}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Recommencer
          </button>
        ) : null}

        <button
          className="game-settings-menu__quit"
          type="button"
          onClick={handleQuit}
        >
          <LogOut size={14} aria-hidden="true" />
          Quitter
        </button>
      </div>
    </div>
  );
}
