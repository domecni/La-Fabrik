import type {
  HierarchicalMapNode,
  MapNode,
  SceneData,
} from "@/types/editor/editor";

const DEFAULT_NEW_NODE_NAME = "new-model";

export function serializeMapNodes(sceneData: SceneData): string {
  const mapPayload = sceneData.mapTree
    ? mergeFlatNodeTransformsIntoTree(sceneData)
    : sceneData.mapNodes.map(removeEditorMetadata);

  return JSON.stringify(mapPayload, null, 2);
}

function createSourcePathKey(sourcePath: readonly number[]): string {
  return sourcePath.join(".");
}

export function removeEditorMetadata(node: MapNode): MapNode {
  return {
    ...(node.id ? { id: node.id } : {}),
    name: node.name,
    type: node.type,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

export function mergeFlatNodeTransformsIntoTree(
  sceneData: SceneData,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nodesBySourcePath = new Map<string, MapNode>();

  for (const node of sceneData.mapNodes) {
    if (!node.sourcePath) continue;
    nodesBySourcePath.set(createSourcePathKey(node.sourcePath), node);
  }

  const cloneNode = (
    node: HierarchicalMapNode,
    path: number[],
  ): HierarchicalMapNode => {
    const updatedNode = nodesBySourcePath.get(createSourcePathKey(path));
    const nextNode: HierarchicalMapNode = {
      ...((updatedNode?.id ?? node.id)
        ? { id: updatedNode?.id ?? node.id }
        : {}),
      name: node.name,
      type: node.type,
      position: updatedNode?.position ?? node.position,
      rotation: updatedNode?.rotation ?? node.rotation,
      scale: updatedNode?.scale ?? node.scale,
    };

    if (node.role) {
      nextNode.role = node.role;
    }

    if (node.children) {
      nextNode.children = node.children.map((child, index) =>
        cloneNode(child, [...path, index]),
      );
    }

    return nextNode;
  };

  const mapTree = sceneData.mapTree;

  if (!mapTree) {
    return sceneData.mapNodes.map(removeEditorMetadata);
  }

  if (Array.isArray(mapTree)) {
    return mapTree.map((node, index) => cloneNode(node, [index]));
  }

  return cloneNode(mapTree, []);
}

function cloneMapTree(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  return JSON.parse(JSON.stringify(mapTree)) as
    | HierarchicalMapNode
    | HierarchicalMapNode[];
}

function collectEditableMapNodes(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): MapNode[] {
  const nodes: MapNode[] = [];

  function visit(node: HierarchicalMapNode, path: number[]): void {
    if (node.role !== "group" && node.type !== "Mesh") {
      nodes.push({
        ...(node.id ? { id: node.id } : {}),
        name: node.name,
        position: node.position,
        rotation: node.rotation,
        scale: node.scale,
        sourcePath: path,
        type: node.type,
      });
    }

    node.children?.forEach((child, index) => visit(child, [...path, index]));
  }

  if (Array.isArray(mapTree)) {
    mapTree.forEach((node, index) => visit(node, [index]));
  } else {
    visit(mapTree, []);
  }

  return nodes;
}

export function updateTreeNodeAtPath(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  path: number[],
  update: (node: HierarchicalMapNode) => HierarchicalMapNode,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const rootNodes = Array.isArray(nextTree) ? nextTree : [nextTree];
  const targetIndex = path[path.length - 1] ?? 0;
  const isRootTarget = Array.isArray(nextTree)
    ? path.length === 1
    : path.length === 0;

  if (isRootTarget) {
    const targetNode = rootNodes[targetIndex];
    if (targetNode) {
      rootNodes[targetIndex] = update(targetNode);
    }
    return nextTree;
  }

  const parentPath = path.slice(0, -1);
  let parent = Array.isArray(nextTree)
    ? rootNodes[parentPath[0] ?? 0]
    : rootNodes[0];
  const childPath = Array.isArray(nextTree) ? parentPath.slice(1) : parentPath;

  for (const index of childPath) {
    parent = parent?.children?.[index];
  }

  if (!parent?.children?.[targetIndex]) return nextTree;
  parent.children[targetIndex] = update(parent.children[targetIndex]);

  return nextTree;
}

export function removeTreeNodeAtPath(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  path: number[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const rootNodes = Array.isArray(nextTree) ? nextTree : [nextTree];
  const targetIndex = path[path.length - 1];
  if (targetIndex === undefined) return nextTree;

  if (Array.isArray(nextTree) && path.length === 1) {
    nextTree.splice(targetIndex, 1);
    return nextTree;
  }

  const parentPath = path.slice(0, -1);
  let parent = Array.isArray(nextTree)
    ? rootNodes[parentPath[0] ?? 0]
    : rootNodes[0];
  const childPath = Array.isArray(nextTree) ? parentPath.slice(1) : parentPath;

  for (const index of childPath) {
    parent = parent?.children?.[index];
  }

  parent?.children?.splice(targetIndex, 1);
  return nextTree;
}

export function updateSceneDataTree(
  sceneData: SceneData,
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): SceneData {
  return {
    ...sceneData,
    mapNodes: collectEditableMapNodes(mapTree),
    mapTree,
  };
}

function findNodePathByName(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  name: string,
): number[] | null {
  function visit(node: HierarchicalMapNode, path: number[]): number[] | null {
    if (node.name === name) return path;

    for (let index = 0; index < (node.children?.length ?? 0); index++) {
      const child = node.children?.[index];
      if (!child) continue;
      const result = visit(child, [...path, index]);
      if (result) return result;
    }

    return null;
  }

  if (Array.isArray(mapTree)) {
    for (let index = 0; index < mapTree.length; index++) {
      const node = mapTree[index];
      if (!node) continue;
      const result = visit(node, [index]);
      if (result) return result;
    }
    return null;
  }

  return visit(mapTree, []);
}

export function addTreeNode(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  node: HierarchicalMapNode,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const blockingPath = findNodePathByName(mapTree, "blocking");
  if (!blockingPath) return mapTree;

  return updateTreeNodeAtPath(mapTree, blockingPath, (blockingNode) => ({
    ...blockingNode,
    children: [...(blockingNode.children ?? []), node],
  }));
}

export function createNewMapNode(name: string): HierarchicalMapNode {
  const safeName = name.trim() || DEFAULT_NEW_NODE_NAME;

  return {
    name: safeName,
    type: "Object3D",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    children: [
      {
        name: safeName,
        type: "Mesh",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
  };
}
