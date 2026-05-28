import type { SceneData } from "@/types/map/mapScene";
import { createSceneDataFromMapPayload } from "@/utils/map/loadMapSceneData";

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

  const mapPayload: unknown = JSON.parse(await mapFile.text());
  const sceneData = await createSceneDataFromMapPayload(mapPayload);
  const models = new Map<string, string>();

  for (const [path, file] of fileMap.entries()) {
    const modelMatch = path.match(/^\/models\/(.+)\/(?:model|\1)\.(glb|gltf)$/);
    const modelName = modelMatch?.[1];
    const modelExtension = modelMatch?.[2];

    if (modelName && (modelExtension === "glb" || !models.has(modelName))) {
      models.set(modelName, URL.createObjectURL(file));
    }
  }

  return { ...sceneData, models };
}

function getProjectRelativePath(file: File): string {
  const relativePath = file.webkitRelativePath || file.name;

  if (!relativePath.includes("/")) {
    return `/${relativePath}`;
  }

  const [, ...pathParts] = relativePath.split("/");
  return `/${pathParts.join("/")}`;
}
