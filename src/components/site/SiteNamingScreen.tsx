import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteButton } from "@/components/site/SiteButton";
import { SITE_CONFIG } from "@/data/site/siteConfig";
import { SITE_DIALOGUE_IDS } from "@/data/site/dialogueIds";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import {
  playDialogueById,
  stopCurrentDialogue,
} from "@/utils/dialogues/playDialogue";

/**
 * Screen 3: Name input
 * The displayed name is forced to SITE_CONFIG.presetPlayerName — the
 * field reveals one letter per keystroke until the preset name is complete.
 */
export function SiteNamingScreen(): React.JSX.Element {
  const setStep = useSiteStore((state) => state.setStep);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const [charIndex, setCharIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const presetPlayerName = SITE_CONFIG.presetPlayerName;
  const displayValue = presetPlayerName.slice(0, charIndex);
  const isComplete = charIndex >= presetPlayerName.length;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled || !manifest) return;
      await playDialogueById(manifest, SITE_DIALOGUE_IDS.naming);
    })();

    return () => {
      cancelled = true;
      stopCurrentDialogue();
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const nextLength = Math.min(
        event.target.value.length,
        presetPlayerName.length,
      );
      setCharIndex(nextLength);
    },
    [presetPlayerName.length],
  );

  const handleConfirm = (): void => {
    if (isComplete) {
      setPlayerName(presetPlayerName);
      setStep("transition");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 80,
        padding: 24,
        width: "100%",
        maxWidth: 950,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <h2
          id="player-name-label"
          style={{
            color: "#F2F2F2",
            textAlign: "center",
            textShadow: "0 7px 14.4px rgba(0, 0, 0, 0.25)",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(18px, 3vw, 26px)",
            fontStyle: "normal",
            fontWeight: 700,
            lineHeight: "normal",
            letterSpacing: "-1.3px",
            margin: 0,
          }}
        >
          Quel est votre prénom ?
        </h2>

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleNameChange}
          placeholder="Écrivez votre prénom ici"
          aria-labelledby="player-name-label"
          aria-describedby="player-name-hint"
          autoComplete="off"
          style={{
            display: "flex",
            padding: "clamp(8px, 1.5vw, 10px)",
            alignItems: "center",
            width: "100%",
            maxWidth: 800,
            minWidth: 280,
            gap: 10,
            border: "4px solid #FFF",
            background: "#D9D9D9",
            outline: "none",
            color: "#333",
            caretColor: "#333",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(16px, 2.5vw, 20px)",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        />
        <span
          id="player-name-hint"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          Votre personnage s&apos;appelle {presetPlayerName}. Tapez{" "}
          {presetPlayerName.length} caractères pour révéler son nom.
        </span>
      </div>

      <SiteButton
        label="CONFIRMER"
        disabled={!isComplete}
        onClick={handleConfirm}
      />
    </div>
  );
}
