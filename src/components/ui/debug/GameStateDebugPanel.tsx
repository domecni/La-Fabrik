import { RotateCcw, StepBack, StepForward } from "lucide-react";
import {
  GAME_STEPS,
  isGameStep,
  MAIN_GAME_STATES,
} from "@/data/game/gameStateConfig";
import {
  isMissionStep,
  MISSION_STEPS,
} from "@/data/gameplay/repairMissionState";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { MainGameState } from "@/types/game";

function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function GameStateDebugPanel(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const pylonStep = useGameStore((state) => state.pylon.currentStep);
  const farmStep = useGameStore((state) => state.farm.currentStep);
  const detail = useGameStore((state) => {
    switch (state.mainState) {
      case "intro":
        return state.intro.currentStep;
      case "ebike":
        return state.ebike.currentStep;
      case "pylon":
        return state.pylon.currentStep;
      case "farm":
        return state.farm.currentStep;
      case "outro":
        return state.outro.hasStarted ? "started" : "waiting";
    }
  });
  const setMainState = useGameStore((state) => state.setMainState);
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const setEbikeState = useGameStore((state) => state.setEbikeState);
  const setPylonState = useGameStore((state) => state.setPylonState);
  const setFarmState = useGameStore((state) => state.setFarmState);
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

    if (mainState === "ebike") {
      setEbikeState({ currentStep: nextSubState });
      return;
    }

    if (mainState === "pylon") {
      setPylonState({ currentStep: nextSubState });
      return;
    }

    if (mainState === "farm") {
      setFarmState({ currentStep: nextSubState });
      return;
    }
  }

  function setDebugMainState(nextMainState: MainGameState): void {
    setMainState(nextMainState);

    if (
      nextMainState === "pylon" ||
      nextMainState === "farm" ||
      nextMainState === "outro"
    ) {
      setEbikeState({ currentStep: "done", isRepaired: true });
    }

    if (nextMainState === "farm" || nextMainState === "outro") {
      setPylonState({ currentStep: "done", isPowered: true });
    }

    if (nextMainState === "outro") {
      setFarmState({ currentStep: "done", irrigationFixed: true });
    }

    if (nextMainState === "ebike" && ebikeStep === "locked") {
      setEbikeState({ currentStep: "waiting" });
      return;
    }

    if (nextMainState === "pylon" && pylonStep === "locked") {
      setPylonState({ currentStep: "waiting" });
      return;
    }

    if (nextMainState === "farm" && farmStep === "locked") {
      setFarmState({ currentStep: "waiting" });
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
