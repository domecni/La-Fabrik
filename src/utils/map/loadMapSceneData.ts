import type {
  HierarchicalMapNode,
  MapNode,
  SceneData,
} from "@/types/map/mapScene";
import { logger } from "@/utils/core/Logger";
import { parseMapData } from "@/utils/map/mapNodeValidation";
import {
  createPotagerMapNode,
  isPotagerSourceMapNode,
  POTAGER_MAP_NAME,
} from "@/utils/map/potagerMapNodes";

const MAP_JSON_PATH = "/map.json";
const MODEL_FILE_NAMES = ["model.glb", "model.gltf"];
const HTML_CONTENT_TYPE = "text/html";
const MAP_STRUCTURE_NODE_NAMES = new Set(["Scene", "blocking"]);
const POSITION_PRECISION = 3;
type ModelEntry = [modelName: string, modelUrl: string];

let cachedSceneData: SceneData | null = null;
let loadingPromise: Promise<SceneData | null> | null = null;
const modelEntryCache = new Map<string, ModelEntry | null>();

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
  const { mapTree } = parseMapData(mapPayload);
  const mapTreeWithPotagers = ensurePotagerMapTree(mapTree);
  const mapNodes = flattenMapTree(mapTreeWithPotagers);
  const deduplicatedNodes = deduplicateMapNodes(mapNodes);
  return createSceneData(deduplicatedNodes, mapTreeWithPotagers);
}

function isSamePosition(a: MapNode, b: MapNode): boolean {
  return a.position.every((value, index) => {
    const otherValue = b.position[index];
    return otherValue !== undefined && Math.abs(value - otherValue) < 0.0001;
  });
}

function cloneMapTree(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  return JSON.parse(JSON.stringify(mapTree)) as
    | HierarchicalMapNode
    | HierarchicalMapNode[];
}

function flattenMapNode(node: HierarchicalMapNode, path: number[]): MapNode[] {
  const childNodes =
    node.children?.flatMap((child, index) =>
      flattenMapNode(child, [...path, index]),
    ) ?? [];

  if (node.role === "group" || node.type === "Mesh") {
    return childNodes;
  }

  return [
    {
      ...(node.id ? { id: node.id } : {}),
      name: node.name,
      type: node.type,
      position: node.position,
      rotation: node.rotation,
      scale: node.scale,
      sourcePath: path,
    },
    ...childNodes,
  ];
}

function flattenMapTree(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): MapNode[] {
  return Array.isArray(mapTree)
    ? mapTree.flatMap((node, index) => flattenMapNode(node, [index]))
    : flattenMapNode(mapTree, []);
}

function collectExplicitPotagerNodes(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): MapNode[] {
  return flattenMapTree(mapTree).filter(
    (node) => node.name === POTAGER_MAP_NAME,
  );
}

function ensurePotagerMapTree(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const explicitPotagers = collectExplicitPotagerNodes(nextTree);

  function visit(node: HierarchicalMapNode): void {
    if (!node.children) return;

    const nextChildren: HierarchicalMapNode[] = [];
    node.children.forEach((child) => {
      nextChildren.push(child);
      visit(child);

      if (!isPotagerSourceMapNode(child)) return;

      const hasMatchingPotager = explicitPotagers.some((potager) =>
        isSamePosition(potager, child),
      );
      if (hasMatchingPotager) return;

      nextChildren.push(createPotagerMapNode(child));
    });

    node.children = nextChildren;
  }

  if (Array.isArray(nextTree)) {
    nextTree.forEach((node) => visit(node));
  } else {
    visit(nextTree);
  }

  return nextTree;
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
  if (modelEntryCache.has(modelName)) {
    return modelEntryCache.get(modelName) ?? null;
  }

  const modelUrls = [...MODEL_FILE_NAMES, `${modelName}.gltf`].map(
    (fileName) => `/models/${modelName}/${fileName}`,
  );

  const results = await Promise.all(
    modelUrls.map(async (modelUrl) => {
      try {
        const response = await fetch(modelUrl, { method: "HEAD" });
        const contentType = response.headers.get("content-type") ?? "";
        return response.ok && !contentType.includes(HTML_CONTENT_TYPE);
      } catch (error) {
        logger.warn("MapSceneData", "Failed to probe map model URL", {
          modelName,
          modelUrl,
          error: error instanceof Error ? error : String(error),
        });
        return false;
      }
    }),
  );

  const modelUrl = modelUrls[results.findIndex(Boolean)] ?? null;
  const entry = modelUrl ? ([modelName, modelUrl] satisfies ModelEntry) : null;

  modelEntryCache.set(modelName, entry);
  return entry;
}
