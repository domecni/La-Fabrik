import { DEFAULT_CATEGORY_VOLUMES } from "@/data/audioConfig";
import { logger } from "@/utils/core/Logger";

export type AudioCategory = "music" | "sfx" | "dialogue";
export type OneShotAudioCategory = Exclude<AudioCategory, "music">;

interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface PlaySoundOptions {
  category?: OneShotAudioCategory;
  pan?: number;
  playbackRate?: number;
}

interface StereoNodes {
  source: MediaElementAudioSourceNode;
  panner: StereoPannerNode;
}

interface OneShotAudioState {
  category: OneShotAudioCategory;
  volume: number;
}

export class AudioManager {
  private static _instance: AudioManager | null = null;
  private readonly _audioPools = new Map<string, HTMLAudioElement[]>();
  private readonly _stereoNodes = new WeakMap<HTMLAudioElement, StereoNodes>();
  private readonly _oneShotStates = new WeakMap<
    HTMLAudioElement,
    OneShotAudioState
  >();
  private readonly _categoryVolumes: Record<AudioCategory, number> = {
    ...DEFAULT_CATEGORY_VOLUMES,
  };
  private _audioContext: AudioContext | null = null;
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
      return;
    }

    this._updateOneShotVolumes(category);
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
    const baseVolume = AudioManager._clampVolume(volume);
    this._oneShotStates.set(audio, { category, volume: baseVolume });
    audio.volume = this._getEffectiveVolume(category, baseVolume);
    audio.playbackRate = options.playbackRate ?? 1;
    audio.currentTime = 0;
    this._setStereoPan(audio, options.pan ?? 0);

    if (this._audioContext?.state === "suspended") {
      void this._audioContext.resume();
    }

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

  playSoundWithCallback(
    path: string,
    volume: number,
    onEnded: () => void,
    options: PlaySoundOptions = {},
  ): HTMLAudioElement {
    const audio = this.playSound(path, volume, options);
    audio.addEventListener("ended", onEnded, { once: true });

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
    void this._audioContext?.close();
    this._audioContext = null;
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
      const music = this._music;
      if (!music) return;

      void music.play().catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          AudioManager.IGNORED_PLAYBACK_ERRORS.has(error.name)
        ) {
          return;
        }

        logger.error("AudioManager", "Failed to unlock music playback", {
          path: this._musicPath,
          error: AudioManager._toLogValue(error),
        });
      });
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

  private _setStereoPan(audio: HTMLAudioElement, pan: number): void {
    const audioContext = this._getAudioContext();
    if (!audioContext || !("createStereoPanner" in audioContext)) return;

    let nodes = this._stereoNodes.get(audio);
    if (!nodes) {
      nodes = {
        source: audioContext.createMediaElementSource(audio),
        panner: audioContext.createStereoPanner(),
      };
      nodes.source.connect(nodes.panner).connect(audioContext.destination);
      this._stereoNodes.set(audio, nodes);
    }

    nodes.panner.pan.value = AudioManager._clampPan(pan);
  }

  private _getAudioContext(): AudioContext | null {
    if (this._audioContext) return this._audioContext;

    const AudioContextConstructor =
      window.AudioContext ??
      (window as AudioContextWindow).webkitAudioContext ??
      null;
    if (!AudioContextConstructor) return null;

    this._audioContext = new AudioContextConstructor();
    return this._audioContext;
  }

  private _getEffectiveVolume(category: AudioCategory, volume: number): number {
    return AudioManager._clampVolume(volume) * this._categoryVolumes[category];
  }

  private _updateOneShotVolumes(category: AudioCategory): void {
    if (category === "music") return;

    this._audioPools.forEach((pool) => {
      pool.forEach((audio) => {
        const state = this._oneShotStates.get(audio);
        if (!state || state.category !== category) return;

        audio.volume = this._getEffectiveVolume(category, state.volume);
      });
    });
  }

  private static _clampPan(pan: number): number {
    return Math.max(-1, Math.min(1, pan));
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
