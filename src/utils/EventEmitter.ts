type Listener<TPayload> = (payload: TPayload) => void;

// TypeScript cannot narrow mapped-type indexed access by a generic key TKey
// (microsoft/TypeScript#30581). The helper below encapsulates the one necessary
// cast so the rest of the class stays cast-free.
type ListenerMap<TEvents extends Record<string, unknown>> = {
  [TKey in keyof TEvents]?: Set<Listener<TEvents[TKey]>>;
};

function getListeners<
  TEvents extends Record<string, unknown>,
  TKey extends keyof TEvents,
>(
  map: ListenerMap<TEvents>,
  key: TKey,
): Set<Listener<TEvents[TKey]>> | undefined {
  return map[key] as Set<Listener<TEvents[TKey]>> | undefined;
}

export class EventEmitter<TEvents extends Record<string, unknown>> {
  private readonly listeners: ListenerMap<TEvents> = {};

  on<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>,
  ): () => void {
    const existing = getListeners(this.listeners, event);

    if (existing) {
      existing.add(listener);
    } else {
      this.listeners[event] = new Set([listener]) as ListenerMap<TEvents>[TKey];
    }

    return () => {
      this.off(event, listener);
    };
  }

  off<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>,
  ): void {
    const currentListeners = getListeners(this.listeners, event);

    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);

    if (currentListeners.size === 0) {
      delete this.listeners[event];
    }
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const currentListeners = getListeners(this.listeners, event);

    if (!currentListeners) {
      return;
    }

    currentListeners.forEach((listener) => {
      listener(payload);
    });
  }

  clear(): void {
    for (const key of Object.keys(this.listeners) as (keyof TEvents)[]) {
      delete this.listeners[key];
    }
  }
}
