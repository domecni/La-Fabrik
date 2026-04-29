import type { MapNode, SceneData } from "@/types/editor";
import { parseMapNodes } from "@/utils/mapNodeValidation";

const MAP_JSON_PATH = "/map.json";
const MODEL_FILE_NAMES = ["model.glb", "model.gltf"];
const HTML_CONTENT_TYPE = "text/html";
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
    uniqueModelNames.map((modelName) => loadModelEntry(modelName)),
  );

  return new Map(modelEntries.filter((entry) => entry !== null));
}

async function loadModelEntry(modelName: string): Promise<ModelEntry | null> {
  for (const fileName of MODEL_FILE_NAMES) {
    const modelUrl = `/models/${modelName}/${fileName}`;

    try {
      const response = await fetch(modelUrl, { method: "HEAD" });
      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && !contentType.includes(HTML_CONTENT_TYPE)) {
        return [modelName, modelUrl];
      }
    } catch {
      continue;
    }
  }

  return null;
}
