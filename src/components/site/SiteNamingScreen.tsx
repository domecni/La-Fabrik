import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteButton } from "@/components/site/SiteButton";
import { SITE_CONFIG } from "@/data/site/siteConfig";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

/**
 * Screen 3: Name input
 */
export function SiteNamingScreen(): React.JSX.Element {
  const setStep = useSiteStore((state) => state.setStep);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const [charIndex, setCharIndex] = useState(0);
  const dialogueStarted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const forcedName = SITE_CONFIG.forcedName;
  const displayValue = forcedName.slice(0, charIndex);
  const isComplete = charIndex >= forcedName.length;

  // Play dialogue when screen appears (with subtitles)
  useEffect(() => {
    if (dialogueStarted.current) return;
    dialogueStarted.current = true;

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (manifest) {
        await playDialogueById(manifest, "narrateur_intro_prenom");
      }
    })();
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const nextLength = Math.min(event.target.value.length, forcedName.length);
      setCharIndex(nextLength);
    },
    [forcedName.length],
  );

  const handleConfirm = (): void => {
    if (isComplete) {
      setPlayerName(forcedName);
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
      </div>

      <SiteButton
        label="CONFIRMER"
        disabled={!isComplete}
        onClick={handleConfirm}
      />
    </div>
  );
}
