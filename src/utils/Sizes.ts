type SizeSnapshot = {
  width: number;
  height: number;
  pixelRatio: number;
};

type SizeListener = (snapshot: SizeSnapshot) => void;

export class Sizes {
  private snapshot: SizeSnapshot;
  private readonly listeners = new Set<SizeListener>();
  private readonly handleResize = (): void => {
    this.snapshot = Sizes.readWindow();
    this.emit();
  };

  constructor() {
    this.snapshot = Sizes.readWindow();
    window.addEventListener("resize", this.handleResize);
  }

  subscribe(listener: SizeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): SizeSnapshot {
    return this.snapshot;
  }

  destroy(): void {
    window.removeEventListener("resize", this.handleResize);
    this.listeners.clear();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.snapshot));
  }

  private static readWindow(): SizeSnapshot {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    };
  }
}
