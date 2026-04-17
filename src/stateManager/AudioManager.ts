export class AudioManager {
  private static _instance: AudioManager | null = null;
  private readonly _audioPools = new Map<string, HTMLAudioElement[]>();

  private static readonly MAX_POOL_SIZE_PER_SOUND = 6;

  static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }

    return AudioManager._instance;
  }

  private constructor() {}

  playSound(path: string, volume = 1): void {
    const audio = this._acquireAudio(path);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;

    void audio.play().catch(() => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  destroy(): void {
    this._audioPools.forEach((pool) => {
      pool.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
    });
    this._audioPools.clear();
    AudioManager._instance = null;
  }

  private _acquireAudio(path: string): HTMLAudioElement {
    const existingPool = this._audioPools.get(path);

    if (existingPool) {
      const availableAudio = existingPool.find(
        (audio) => audio.paused || audio.ended,
      );
      if (availableAudio) return availableAudio;

      if (existingPool.length < AudioManager.MAX_POOL_SIZE_PER_SOUND) {
        const pooledAudio = new Audio(path);
        existingPool.push(pooledAudio);
        return pooledAudio;
      }

      return existingPool[0]!;
    }

    const initialAudio = new Audio(path);
    this._audioPools.set(path, [initialAudio]);
    return initialAudio;
  }
}
