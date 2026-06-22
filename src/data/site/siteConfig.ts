import type { CSSProperties } from "react";
import { assetUrl } from "@/utils/assetUrl";

const BACKGROUND_IMAGE = assetUrl("/assets/bg-site.webp");

export const SITE_CONFIG = {
  backgroundImage: BACKGROUND_IMAGE,
  presetPlayerName: "Danyl",
} as const;

/**
 * Shared background style used by SiteLayout and SiteMobileBlocker.
 */
export const SITE_BACKGROUND_STYLE: CSSProperties = {
  backgroundColor: "#87CEEB",
  backgroundImage: `url(${BACKGROUND_IMAGE})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

export interface SiteCardConfig {
  id: string;
  label: string;
  imagePath?: string;
  disabled: boolean;
}

/**
 * Cards for screen 1: "Choisissez une expérience"
 */
export const EXPERIENCE_CARDS: readonly SiteCardConfig[] = [
  { id: "exp-fabrik", label: "La Fabrik", disabled: false },
  { id: "exp-ferme", label: "La Ferme verticale", disabled: true },
  { id: "exp-energie", label: "La Zone d'énergie", disabled: true },
  { id: "exp-ecole", label: "L'École", disabled: true },
];

/**
 * Cards for screen 2: "Quelle est votre situation ?"
 */
export const SITUATION_CARDS: readonly SiteCardConfig[] = [
  { id: "sit-sans-domicile", label: "Sans domicile fixe", disabled: true },
  { id: "sit-refugie-guerre", label: "Réfugié.e de guerre", disabled: true },
  {
    id: "sit-refugie-climat",
    label: "Réfugié.e climatique",
    disabled: false,
  },
  { id: "sit-autre", label: "Autre", disabled: true },
];
