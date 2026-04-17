export type InteractableKind = "grab" | "trigger";

export interface InteractableHandle {
  kind: InteractableKind;
  label: string;
  onPress: () => void;
  onRelease: () => void;
}

export interface InteractionSnapshot {
  focused: InteractableHandle | null;
  holding: boolean;
}

export class InteractionManager {
  private static _instance: InteractionManager | null = null;

  private _focused: InteractableHandle | null = null;
  private _holding = false;
  private _holdingHandle: InteractableHandle | null = null;
  private readonly _listeners = new Set<() => void>();

  static getInstance(): InteractionManager {
    if (!InteractionManager._instance) {
      InteractionManager._instance = new InteractionManager();
    }

    return InteractionManager._instance;
  }

  private constructor() {}

  getState(): InteractionSnapshot {
    return {
      focused: this._focused,
      holding: this._holding,
    };
  }

  setFocused(handle: InteractableHandle | null): void {
    if (this._focused === handle) return;
    if (this._holding) return;

    this._focused = handle;
    this._emit();
  }

  pressInteract(): void {
    if (!this._focused) return;

    this._holding = this._focused.kind === "grab";
    if (this._holding) this._holdingHandle = this._focused;
    this._focused.onPress();
    this._emit();
  }

  releaseInteract(): void {
    const handle = this._holding ? this._holdingHandle : null;
    if (!handle) return;

    handle.onRelease();
    this._holding = false;
    this._holdingHandle = null;
    this._emit();
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  destroy(): void {
    this._focused = null;
    this._holding = false;
    this._holdingHandle = null;
    this._listeners.clear();
    InteractionManager._instance = null;
  }

  private _emit(): void {
    this._listeners.forEach((cb) => cb());
  }
}
