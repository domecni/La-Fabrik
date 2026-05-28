import { RotateCcw, StepBack, StepForward } from "lucide-react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { isMissionStep, MISSION_STEPS } from "@/types/gameplay/repairMission";
import {
  GAME_STEPS,
  isGameStep,
  MAIN_GAME_STATES,
  type MainGameState,
} from "@/types/game";

function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function GameStateDebugPanel(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);
  const bikeStep = useGameStore((state) => state.bike.currentStep);
  const pyloneStep = useGameStore((state) => state.pylone.currentStep);
  const fermeStep = useGameStore((state) => state.ferme.currentStep);
  const detail = useGameStore((state) => {
    switch (state.mainState) {
      case "intro":
        return state.intro.currentStep;
      case "bike":
        return state.bike.currentStep;
      case "pylone":
        return state.pylone.currentStep;
      case "ferme":
        return state.ferme.currentStep;
      case "outro":
        return state.outro.hasStarted ? "started" : "waiting";
    }
  });
  const setMainState = useGameStore((state) => state.setMainState);
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const setBikeState = useGameStore((state) => state.setBikeState);
  const setPyloneState = useGameStore((state) => state.setPyloneState);
  const setFermeState = useGameStore((state) => state.setFermeState);
  const setOutroState = useGameStore((state) => state.setOutroState);
  const advanceGameState = useGameStore((state) => state.advanceGameState);
  const rewindGameState = useGameStore((state) => state.rewindGameState);
  const resetGame = useGameStore((state) => state.resetGame);

  const subStateOptions =
    mainState === "intro"
      ? GAME_STEPS
      : mainState === "outro"
        ? ["waiting", "started"]
        : MISSION_STEPS;

  function setSubState(nextSubState: string): void {
    if (mainState === "intro") {
      if (isGameStep(nextSubState)) {
        setIntroStep(nextSubState);
      }
      return;
    }

    if (mainState === "outro") {
      setOutroState({ hasStarted: nextSubState === "started" });
      return;
    }

    if (!isMissionStep(nextSubState)) return;

    if (mainState === "bike") {
      setBikeState({ currentStep: nextSubState });
      return;
    }

    if (mainState === "pylone") {
      setPyloneState({ currentStep: nextSubState });
      return;
    }

    if (mainState === "ferme") {
      setFermeState({ currentStep: nextSubState });
      return;
    }
  }

  function setDebugMainState(nextMainState: MainGameState): void {
    setMainState(nextMainState);

    if (nextMainState === "bike" && bikeStep === "locked") {
      setBikeState({ currentStep: "waiting" });
      return;
    }

    if (nextMainState === "pylone" && pyloneStep === "locked") {
      setPyloneState({ currentStep: "waiting" });
      return;
    }

    if (nextMainState === "ferme" && fermeStep === "locked") {
      setFermeState({ currentStep: "waiting" });
    }
  }

  return (
    <section
      className="game-state-debug-panel debug-overlay-section"
      aria-label="Game state debug panel"
    >
      <div className="game-state-debug-panel__header">
        <h3>Game State</h3>
      </div>

      <div className="game-state-debug-panel__switch-group">
        <div className="game-state-debug-panel__switch-heading">
          <span>Main state</span>
          <strong>{toPascalCase(mainState)}</strong>
        </div>
        <div
          className="game-state-debug-panel__states"
          aria-label="Main states"
          role="group"
        >
          {MAIN_GAME_STATES.map((state) => (
            <button
              key={state}
              aria-pressed={state === mainState}
              className={state === mainState ? "is-active" : undefined}
              type="button"
              onClick={() => setDebugMainState(state)}
            >
              {toPascalCase(state)}
            </button>
          ))}
        </div>
      </div>

      <div className="game-state-debug-panel__switch-group">
        <div className="game-state-debug-panel__switch-heading">
          <span>Sub state</span>
          <strong>{toPascalCase(detail)}</strong>
        </div>
        <div
          className="game-state-debug-panel__states"
          aria-label="Sub states"
          role="group"
        >
          {subStateOptions.map((subState) => (
            <button
              key={subState}
              aria-pressed={subState === detail}
              className={subState === detail ? "is-active" : undefined}
              type="button"
              onClick={() => setSubState(subState)}
            >
              {toPascalCase(subState)}
            </button>
          ))}
        </div>
      </div>

      <div className="game-state-debug-panel__actions">
        <button type="button" onClick={rewindGameState}>
          <StepBack aria-hidden="true" size={14} />
          Previous step
        </button>
        <button type="button" onClick={advanceGameState}>
          <StepForward aria-hidden="true" size={14} />
          Next step
        </button>
        <button type="button" onClick={resetGame}>
          <RotateCcw aria-hidden="true" size={14} />
          Reset
        </button>
      </div>
    </section>
  );
}
