/**
 * Dialogue manifest IDs used by the /site flow and the intro sequence.
 * Defined once here so components don't hold magic strings.
 */
export const SITE_DIALOGUE_IDS = {
  naming: "narrateur_intro_prenom",
  transition: "narrateur_intro_apresprenom",
  introOrder: "narrateur_ordreebike",
} as const;
