import type {
  GrabInteractableHandle,
  InteractableHandle,
  InteractionSnapshot,
} from "@/types/interaction/interaction";
import { EventEmitter } from "@/utils/core/EventEmitter";

interface InteractionManagerEvents {
  change: void;
}

export class InteractionManager {
  private static _instance: InteractionManager | null = null;

  private _focused: InteractableHandle | null = null;
  private readonly _nearbyHandles = new Set<InteractableHandle>();
  private _holding = false;
  private _handHolding = false;
  private _holdingHandle: GrabInteractableHandle | null = null;
  private _snapshot: InteractionSnapshot = {
    focused: null,
    nearby: false,
    holding: false,
    handHolding: false,
  };
  private readonly _events = new EventEmitter<InteractionManagerEvents>();

  static getInstance(): InteractionManager {
    if (!InteractionManager._instance) {
      InteractionManager._instance = new InteractionManager();
    }

    return InteractionManager._instance;
  }

  private constructor() {}

  getState(): InteractionSnapshot {
    return this._snapshot;
  }

  setFocused(handle: InteractableHandle | null): void {
    if (this._focused === handle) return;
    if (this._holding) return;

    this._focused = handle;
    this._emit();
  }

  setNearby(handle: InteractableHandle, nearby: boolean): void {
    const hadHandle = this._nearbyHandles.has(handle);
    if (nearby === hadHandle) return;

    if (nearby) {
      this._nearbyHandles.add(handle);
    } else {
      this._nearbyHandles.delete(handle);
    }

    this._emit();
  }

  setHandHolding(holding: boolean): void {
    if (this._handHolding === holding) return;

    this._handHolding = holding;
    this._emit();
  }

  pressInteract(): void {
    if (!this._focused) return;

    if (this._focused.kind === "grab") {
      this._holding = true;
      this._holdingHandle = this._focused;
    } else {
      this._holding = false;
      this._holdingHandle = null;
    }

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
    return this._events.on("change", listener);
  }

  destroy(): void {
    this._focused = null;
    this._nearbyHandles.clear();
    this._holding = false;
    this._handHolding = false;
    this._holdingHandle = null;
    this._snapshot = {
      focused: null,
      nearby: false,
      holding: false,
      handHolding: false,
    };
    this._events.clear();
    InteractionManager._instance = null;
  }

  private _emit(): void {
    this._snapshot = {
      focused: this._focused,
      nearby: this._nearbyHandles.size > 0,
      holding: this._holding,
      handHolding: this._handHolding,
    };
    this._events.emit("change", undefined);
  }
}
