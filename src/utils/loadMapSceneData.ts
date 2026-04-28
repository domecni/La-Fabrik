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

export async function createSceneData(mapNodes: MapNode[]): Promise<SceneData> {
  const models = await loadMapModelUrls(mapNodes);
  return { mapNodes, models };
}

async function loadMapModelUrls(
  mapNodes: MapNode[],
): Promise<Map<string, string>> {
  const models = new Map<string, string>();
  const uniqueModelNames = [...new Set(mapNodes.map((node) => node.name))];

  for (const modelName of uniqueModelNames) {
    const modelUrl = `/models/${modelName}/${MODEL_FILE_NAME}`;

    try {
      const modelResponse = await fetch(modelUrl);
      if (!modelResponse.ok) continue;

      const text = await modelResponse.text();
      if (isGltfContent(text)) {
        models.set(modelName, modelUrl);
      }
    } catch {
      /* Missing models are expected while editing incomplete maps. */
    }
  }

  return models;
}

function isGltfContent(text: string): boolean {
  return (
    text.includes('"glTF"') ||
    text.includes('"scene"') ||
    text.includes('"nodes"')
  );
}
