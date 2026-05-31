import { useEffect } from "react";
import { AudioManager } from "@/managers/AudioManager";

const GAME_MUSIC_PATH = "/sounds/musique/musique-jeu.mp3";
const GAME_MUSIC_VOLUME = 0.33;

export function GameMusic(): null {
  useEffect(() => {
    const audio = AudioManager.getInstance();
    audio.playMusic(GAME_MUSIC_PATH, GAME_MUSIC_VOLUME);

    return () => {
      audio.stopMusic();
    };
  }, []);

  return null;
}
