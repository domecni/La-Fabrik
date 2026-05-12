import { useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";

export function IntroUI(): React.JSX.Element | null {
  const step = useGameStore((state) => state.intro.currentStep);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const setStep = useGameStore((state) => state.setIntroStep);
  const [inputValue, setInputValue] = useState("");

  if (step !== "naming") return null;

  const handleSubmit = (): void => {
    if (inputValue.trim() === "") return;

    console.log("[IntroUI] Submitting, name:", inputValue.trim());
    setPlayerName(inputValue.trim());
    console.log("[IntroUI] Calling transitionTo('bienvenue')");
    setStep("bienvenue");
    console.log("[IntroUI] After transitionTo, step should be:", step);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "2rem",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          minWidth: "300px",
        }}
      >
        <h2
          style={{
            color: "#fff",
            margin: 0,
            fontSize: "1.5rem",
            textAlign: "center",
          }}
        >
          Quel est votre prénom ?
        </h2>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre prénom"
          autoFocus
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "6px",
            border: "1px solid #444",
            backgroundColor: "#2a2a2a",
            color: "#fff",
            outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={inputValue.trim() === ""}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: inputValue.trim() ? "#4a9" : "#444",
            color: "#fff",
            cursor: inputValue.trim() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
          }}
        >
          Valider
        </button>
      </div>
    </div>
  );
}

export function BienvenueDisplay(): React.JSX.Element | null {
  const step = useGameStore((state) => state.intro.currentStep);
  const playerName = useGameStore((state) => state.missionFlow.playerName);

  if (step !== "bienvenue") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "1rem 2rem",
        borderRadius: "8px",
        zIndex: 100,
      }}
    >
      <p
        style={{
          color: "#fff",
          margin: 0,
          fontSize: "1.25rem",
        }}
      >
        Bienvenue {playerName} !
      </p>
    </div>
  );
}
