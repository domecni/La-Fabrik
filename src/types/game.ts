import type { RepairMissionId } from "@/types/gameplay/repairMission";

/**
 * Steps for the /site onboarding page
 */
export type SiteStep =
  | "disclaimer" // Écran 0: Avertissement (ordi recommandé, bonne connexion)
  | "welcome" // Écran 1: Bienvenue à Altera
  | "situation" // Écran 2: Quelle est votre situation
  | "naming" // Écran 3: Quel est votre prénom (Danyl)
  | "transition"; // Fondu noir + dialogue final

/**
 * Steps for the intro sequence (after /site, on / route)
 */
export type GameStep =
  | "loading-map" // Chargement des assets
  | "fade-to-video" // Fondu noir entre chargement et vidéo
  | "video" // Vidéo intro.mp4
  | "dialogue-intro" // Dialogues post-vidéo (écran noir)
  | "reveal" // Fondu noir → jeu visible
  | "playing"; // Intro terminée, jeu actif

export type MainGameState = "intro" | RepairMissionId | "outro";
