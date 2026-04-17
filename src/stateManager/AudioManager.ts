export class AudioManager {
  private static _instance: AudioManager | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }

    return AudioManager._instance;
  }

  private constructor() {}

  playSound(path: string, volume = 1): void {
    const audio = new Audio(path);
    audio.volume = Math.max(0, Math.min(1, volume));
    void audio.play();
  }

  destroy(): void {
    AudioManager._instance = null;
  }
}
