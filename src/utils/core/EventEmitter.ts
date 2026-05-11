type Listener<TPayload> = (payload: TPayload) => void;

type ListenerMap<TEvents extends object> = {
  [TKey in keyof TEvents]?: Set<Listener<TEvents[TKey]>>;
};

export class EventEmitter<TEvents extends object> {
  private readonly listeners: ListenerMap<TEvents> = {};

  on<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>,
  ): () => void {
    const existing = this.listeners[event];

    if (existing) {
      existing.add(listener);
    } else {
      this.listeners[event] = new Set([listener]);
    }

    return () => {
      this.off(event, listener);
    };
  }

  off<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>,
  ): void {
    const currentListeners = this.listeners[event];

    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);

    if (currentListeners.size === 0) {
      delete this.listeners[event];
    }
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const currentListeners = this.listeners[event];

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
