import type { MapNode, SceneData } from "@/types/editor";

const MAP_JSON_PATH = "/map.json";
const MODEL_FILE_NAME = "model.gltf";

export async function loadMapSceneData(): Promise<SceneData | null> {
  const response = await fetch(MAP_JSON_PATH);

  if (!response.ok) {
    return null;
  }

  const mapNodes: MapNode[] = await response.json();
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
        return response.ok ? ([modelName, modelUrl] as const) : null;
      } catch {
        return null;
      }
    }),
  );

  return new Map(modelEntries.filter((entry) => entry !== null));
}
