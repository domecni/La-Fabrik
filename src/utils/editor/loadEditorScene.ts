import type { MapNode, SceneData } from "@/types/editor";

const MAP_JSON_PATH = "/map.json";

export async function createSceneDataFromFiles(
  files: FileList,
): Promise<SceneData> {
  const fileMap = new Map<string, File>();

  for (const file of Array.from(files)) {
    fileMap.set(getProjectRelativePath(file), file);
  }

  const mapFile = fileMap.get(MAP_JSON_PATH);
  if (!mapFile) {
    throw new Error("Fichier map.json manquant à la racine du dossier");
  }

  const mapNodes: MapNode[] = JSON.parse(await mapFile.text());
  const models = new Map<string, string>();

  for (const [path, file] of fileMap.entries()) {
    const modelMatch = path.match(/^\/models\/(.+)\/model\.gltf$/);
    if (modelMatch?.[1]) {
      models.set(modelMatch[1], URL.createObjectURL(file));
    }
  }

  return { mapNodes, models };
}

function getProjectRelativePath(file: File): string {
  const relativePath = file.webkitRelativePath || file.name;

  if (!relativePath.includes("/")) {
    return `/${relativePath}`;
  }

  const [, ...pathParts] = relativePath.split("/");
  return `/${pathParts.join("/")}`;
}
