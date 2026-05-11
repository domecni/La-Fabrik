import type { CinematicManifest } from "@/types/cinematics/cinematics";
import { parseCinematicManifest } from "@/utils/cinematics/cinematicManifestValidation";

const CINEMATIC_MANIFEST_PATH = "/cinematics.json";

export async function loadCinematicManifest(): Promise<CinematicManifest | null> {
  const response = await fetch(CINEMATIC_MANIFEST_PATH);

  if (!response.ok) {
    return null;
  }

  return parseCinematicManifest(await response.json());
}
