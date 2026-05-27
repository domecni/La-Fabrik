import type {
  HierarchicalMapNode,
  MapNode,
  SceneData,
} from "@/types/editor/editor";
import { parseMapData } from "@/utils/map/mapNodeValidation";

const MAP_JSON_PATH = "/map.json";
const MODEL_FILE_NAMES = ["model.glb", "model.gltf"];
const HTML_CONTENT_TYPE = "text/html";
const MAP_STRUCTURE_NODE_NAMES = new Set(["Scene", "blocking"]);
const POSITION_PRECISION = 3;
type ModelEntry = [modelName: string, modelUrl: string];

let cachedSceneData: SceneData | null = null;
let loadingPromise: Promise<SceneData | null> | null = null;

export async function loadMapSceneData(): Promise<SceneData | null> {
  if (cachedSceneData) {
    return cachedSceneData;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = loadMapSceneDataInternal();

  try {
    cachedSceneData = await loadingPromise;
  } finally {
    loadingPromise = null;
  }

  return cachedSceneData;
}

export function getMapNodes(): MapNode[] | null {
  return cachedSceneData?.mapNodes ?? null;
}

export function getMapNodesByName(name: string): MapNode[] {
  const nodes = cachedSceneData?.mapNodes;
  if (!nodes) return [];
  return nodes.filter((node) => node.name === name);
}

async function loadMapSceneDataInternal(): Promise<SceneData | null> {
  const response = await fetch(MAP_JSON_PATH);

  if (!response.ok) {
    return null;
  }

  const mapPayload: unknown = await response.json();
  return createSceneDataFromMapPayload(mapPayload);
}

export async function createSceneDataFromMapPayload(
  mapPayload: unknown,
): Promise<SceneData> {
  const { mapNodes, mapTree } = parseMapData(mapPayload);
  const deduplicatedNodes = deduplicateMapNodes(mapNodes);
  return createSceneData(deduplicatedNodes, mapTree);
}

function createPositionKey(node: MapNode): string {
  const [x, y, z] = node.position;
  const px = x.toFixed(POSITION_PRECISION);
  const py = y.toFixed(POSITION_PRECISION);
  const pz = z.toFixed(POSITION_PRECISION);
  return `${node.name}:${px},${py},${pz}`;
}

function deduplicateMapNodes(nodes: MapNode[]): MapNode[] {
  const seen = new Set<string>();
  const result: MapNode[] = [];

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === "Object3D" && b.type !== "Object3D") return -1;
    if (a.type !== "Object3D" && b.type === "Object3D") return 1;
    return 0;
  });

  for (const node of sortedNodes) {
    if (MAP_STRUCTURE_NODE_NAMES.has(node.name)) {
      result.push(node);
      continue;
    }

    const key = createPositionKey(node);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(node);
    }
  }

  return result;
}

async function createSceneData(
  mapNodes: MapNode[],
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): Promise<SceneData> {
  const models = await loadMapModelUrls(mapNodes);
  return { mapNodes, models, mapTree };
}

async function loadMapModelUrls(
  mapNodes: MapNode[],
): Promise<Map<string, string>> {
  const uniqueModelNames = [
    ...new Set(
      mapNodes
        .filter((node) => !MAP_STRUCTURE_NODE_NAMES.has(node.name))
        .map((node) => node.name),
    ),
  ];
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
