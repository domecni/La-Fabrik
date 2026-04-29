import type { MapNode, SceneData } from "@/types/editor";
import { parseMapNodes } from "@/utils/mapNodeValidation";

const MAP_JSON_PATH = "/map.json";
const MODEL_FILE_NAME = "model.gltf";
type ModelEntry = [modelName: string, modelUrl: string];

export async function loadMapSceneData(): Promise<SceneData | null> {
  const response = await fetch(MAP_JSON_PATH);

  if (!response.ok) {
    return null;
  }

  const mapNodes = parseMapNodes(await response.json());
  return createSceneData(mapNodes);
}

async function createSceneData(mapNodes: MapNode[]): Promise<SceneData> {
  const models = await loadMapModelUrls(mapNodes);
  return { mapNodes, models };
}

async function loadMapModelUrls(
  mapNodes: MapNode[],
): Promise<Map<string, string>> {
  const uniqueModelNames = [...new Set(mapNodes.map((node) => node.name))];
  const modelEntries = await Promise.all(
    uniqueModelNames.map(async (modelName) => {
      const modelUrl = `/models/${modelName}/${MODEL_FILE_NAME}`;

      try {
        const response = await fetch(modelUrl, { method: "HEAD" });
        const modelEntry: ModelEntry = [modelName, modelUrl];
        return response.ok ? modelEntry : null;
      } catch {
        return null;
      }
    }),
  );

  return new Map(modelEntries.filter((entry) => entry !== null));
}
