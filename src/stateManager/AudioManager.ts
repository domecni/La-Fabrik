import { logger } from "@/utils/logger";

export class AudioManager {
  private static _instance: AudioManager | null = null;
  private readonly _audioPools = new Map<string, HTMLAudioElement[]>();

  private static readonly MAX_POOL_SIZE_PER_SOUND = 6;
  private static readonly IGNORED_PLAYBACK_ERRORS = new Set([
    "AbortError",
    "NotAllowedError",
  ]);

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

    void audio.play().catch((error: unknown) => {
      if (
        error instanceof DOMException &&
        AudioManager.IGNORED_PLAYBACK_ERRORS.has(error.name)
      ) {
        return;
      }

      logger.error("AudioManager", "Failed to play sound", {
        path,
        error: AudioManager._toLogValue(error),
      });
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

      const recycledAudio = existingPool[0];
      if (recycledAudio) return recycledAudio;
    }

    const initialAudio = new Audio(path);
    this._audioPools.set(path, [initialAudio]);
    return initialAudio;
  }

  private static _toLogValue(error: unknown): Error | DOMException | string {
    if (error instanceof Error || error instanceof DOMException) {
      return error;
    }

    return String(error);
  }
}
