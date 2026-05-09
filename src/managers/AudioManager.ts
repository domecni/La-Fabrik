import { logger } from "@/utils/core/logger";

export type AudioCategory = "music" | "sfx" | "dialogue";
export type OneShotAudioCategory = Exclude<AudioCategory, "music">;

const DEFAULT_CATEGORY_VOLUMES: Record<AudioCategory, number> = {
  music: 1,
  sfx: 1,
  dialogue: 1,
};

interface PlaySoundOptions {
  category?: OneShotAudioCategory;
  playbackRate?: number;
}

export class AudioManager {
  private static _instance: AudioManager | null = null;
  private readonly _audioPools = new Map<string, HTMLAudioElement[]>();
  private readonly _categoryVolumes: Record<AudioCategory, number> = {
    ...DEFAULT_CATEGORY_VOLUMES,
  };
  private _music: HTMLAudioElement | null = null;
  private _musicPath: string | null = null;
  private _musicVolume = 1;
  private _musicUnlockHandler: (() => void) | null = null;

  private static readonly MAX_POOL_SIZE_PER_SOUND = 6;
  private static readonly DEFAULT_SOUND_CATEGORY: OneShotAudioCategory = "sfx";
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

  setCategoryVolume(category: AudioCategory, volume: number): void {
    this._categoryVolumes[category] = AudioManager._clampVolume(volume);

    if (category === "music" && this._music) {
      this._music.volume = this._getEffectiveVolume("music", this._musicVolume);
    }
  }

  getCategoryVolume(category: AudioCategory): number {
    return this._categoryVolumes[category];
  }

  playSound(
    path: string,
    volume = 1,
    options: PlaySoundOptions = {},
  ): HTMLAudioElement {
    const audio = this._acquireAudio(path);
    const category = options.category ?? AudioManager.DEFAULT_SOUND_CATEGORY;
    audio.volume = this._getEffectiveVolume(category, volume);
    audio.playbackRate = options.playbackRate ?? 1;
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
        category,
        error: AudioManager._toLogValue(error),
      });
    });

    return audio;
  }

  playMusic(path: string, volume = 1): void {
    this._musicVolume = AudioManager._clampVolume(volume);

    if (this._musicPath === path && this._music) {
      this._music.volume = this._getEffectiveVolume("music", this._musicVolume);
      if (!this._music.paused) return;
    } else {
      this.stopMusic();
      this._music = new Audio(path);
      this._music.loop = true;
      this._musicPath = path;
    }

    this._music.volume = this._getEffectiveVolume("music", this._musicVolume);

    void this._music.play().catch((error: unknown) => {
      if (
        error instanceof DOMException &&
        AudioManager.IGNORED_PLAYBACK_ERRORS.has(error.name)
      ) {
        this._waitForUserGestureToPlayMusic();
        return;
      }

      logger.error("AudioManager", "Failed to play music", {
        path,
        error: AudioManager._toLogValue(error),
      });
    });
  }

  stopMusic(): void {
    this._removeMusicUnlockHandler();
    this._music?.pause();
    this._music = null;
    this._musicPath = null;
  }

  destroy(): void {
    this.stopMusic();
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

  private _waitForUserGestureToPlayMusic(): void {
    if (this._musicUnlockHandler) return;

    this._musicUnlockHandler = () => {
      this._removeMusicUnlockHandler();
      void this._music?.play();
    };

    window.addEventListener("pointerdown", this._musicUnlockHandler, {
      once: true,
    });
    window.addEventListener("keydown", this._musicUnlockHandler, {
      once: true,
    });
  }

  private _removeMusicUnlockHandler(): void {
    if (!this._musicUnlockHandler) return;

    window.removeEventListener("pointerdown", this._musicUnlockHandler);
    window.removeEventListener("keydown", this._musicUnlockHandler);
    this._musicUnlockHandler = null;
  }

  private _getEffectiveVolume(category: AudioCategory, volume: number): number {
    return AudioManager._clampVolume(volume) * this._categoryVolumes[category];
  }

  private static _clampVolume(volume: number): number {
    return Math.max(0, Math.min(1, volume));
  }

  private static _toLogValue(error: unknown): Error | DOMException | string {
    if (error instanceof Error || error instanceof DOMException) {
      return error;
    }

    return String(error);
  }
}
