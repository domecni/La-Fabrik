const GENERATED_MAP_MODEL_NAMES = new Set([
  "ecole",
  "fermeverticale",
  "generateur",
  "lafabrik",
]);

export function isGeneratedMapModelName(name: string): boolean {
  return GENERATED_MAP_MODEL_NAMES.has(name);
}
