export const SITE_CONFIG = {
  backgroundImage: "/assets/bg-site.png",
  forcedName: "Danyl",
} as const;

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
  { id: "sit-refugie-climat", label: "Réfugié.e climatique", disabled: true },
  { id: "sit-refugie-guerre", label: "Réfugié.e de guerre", disabled: true },
  {
    id: "sit-sans-domicile",
    label: "Sans domicile fixe",
    disabled: false,
  },
  { id: "sit-autre", label: "Autre", disabled: true },
];
