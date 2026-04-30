type TickListener = (delta: number, elapsed: number) => void;

export class Time {
  private readonly listeners = new Set<TickListener>();
  private animationFrameId = 0;
  private lastTick = performance.now();
  private elapsed = 0;

  constructor() {
    this.tick = this.tick.bind(this);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  subscribe(listener: TickListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getElapsed(): number {
    return this.elapsed;
  }

  destroy(): void {
    window.cancelAnimationFrame(this.animationFrameId);
    this.listeners.clear();
  }

  private tick(now: number): void {
    const delta = (now - this.lastTick) / 1000;
    this.lastTick = now;
    this.elapsed += delta;

    this.listeners.forEach((listener) => {
      listener(delta, this.elapsed);
    });

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }
}
