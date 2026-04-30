import { Debug } from "@/utils/debug/Debug";
import {
  type MainGameState,
  useGameStore,
} from "@/managers/stores/useGameStore";

const MAIN_STATES: MainGameState[] = [
  "intro",
  "bike",
  "pylone",
  "ferme",
  "outro",
];

export function GameStateHUD(): React.JSX.Element | null {
  const debug = Debug.getInstance();
  const mainState = useGameStore((state) => state.mainState);
  const detail = useGameStore((state) => {
    switch (state.mainState) {
      case "intro":
        return state.intro.hasCompleted ? "completed" : "waiting";
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
  const advanceGameState = useGameStore((state) => state.advanceGameState);
  const resetGame = useGameStore((state) => state.resetGame);

  if (!debug.active) return null;

  return (
    <aside className="game-state-hud" aria-label="Game state debug panel">
      <div className="game-state-hud__header">
        <span>Game State</span>
        <strong>{mainState}</strong>
      </div>

      <p className="game-state-hud__detail">Sub state: {detail}</p>

      <div className="game-state-hud__states" aria-label="Main states">
        {MAIN_STATES.map((state) => (
          <button
            key={state}
            className={state === mainState ? "is-active" : undefined}
            type="button"
            onClick={() => setMainState(state)}
          >
            {state}
          </button>
        ))}
      </div>

      <div className="game-state-hud__actions">
        <button type="button" onClick={advanceGameState}>
          Next step
        </button>
        <button type="button" onClick={resetGame}>
          Reset
        </button>
      </div>
    </aside>
  );
}
