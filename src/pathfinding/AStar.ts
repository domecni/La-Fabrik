import { Grid } from "./Grid";
import type { GridNode, Position } from "./types";

/**
 * Calculates the octile heuristic distance between two nodes.
 * Ideal for 8-directional grid movement.
 */
function getOctileDistance(nodeA: GridNode, nodeB: GridNode): number {
  const dx = Math.abs(nodeA.x - nodeB.x);
  const dy = Math.abs(nodeA.y - nodeB.y);

  const D = 1; // Orthogonal movement cost
  const D2 = 1.414; // Diagonal movement cost (approx Math.sqrt(2))

  return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
}

/**
 * Finds the shortest path between start and end positions on the grid.
 * Returns an array of Positions representing the path, or an empty array if no path is found.
 */
export function findPath(
  grid: Grid,
  startPos: Position,
  endPos: Position,
  allowDiagonals: boolean = true,
): Position[] {
  grid.reset();

  const startNode = grid.getNode(
    Math.floor(startPos.x),
    Math.floor(startPos.y),
  );
  const endNode = grid.getNode(Math.floor(endPos.x), Math.floor(endPos.y));

  if (!startNode || !endNode) {
    return [];
  }

  // If the destination node itself is blocked, we try to find the nearest walkable neighbor
  if (!endNode.walkable) {
    const endNeighbors = grid.getNeighbors(endNode, allowDiagonals);
    if (endNeighbors.length === 0) {
      return [];
    }
    // Set destination to the closest walkable neighbor
    let closestNeighbor = endNeighbors[0]!;
    let minDist = getOctileDistance(startNode, closestNeighbor);
    for (let i = 1; i < endNeighbors.length; i++) {
      const neighbor = endNeighbors[i]!;
      const dist = getOctileDistance(startNode, neighbor);
      if (dist < minDist) {
        minDist = dist;
        closestNeighbor = neighbor;
      }
    }
    // Reroute to that walkable neighbor
    return findPath(
      grid,
      startPos,
      { x: closestNeighbor.x, y: closestNeighbor.y },
      allowDiagonals,
    );
  }

  const openSet: GridNode[] = [startNode];
  const closedSet = new Set<GridNode>();

  startNode.g = 0;
  startNode.h = getOctileDistance(startNode, endNode);
  startNode.f = startNode.h;

  while (openSet.length > 0) {
    // Find the node in openSet with the lowest f value
    let lowIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      const node = openSet[i]!;
      const lowNode = openSet[lowIndex]!;
      if (node.f < lowNode.f) {
        lowIndex = i;
      }
    }

    const currentNode = openSet[lowIndex]!;

    // Check if we reached the destination
    if (currentNode === endNode) {
      const path: Position[] = [];
      let temp: GridNode | null = currentNode;
      while (temp !== null) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    // Remove currentNode from openSet and add to closedSet
    openSet.splice(lowIndex, 1);
    closedSet.add(currentNode);

    const neighbors = grid.getNeighbors(currentNode, allowDiagonals);

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) {
        continue;
      }

      // Calculate cost to move to this neighbor (1 for orthogonal, 1.414 for diagonal)
      const isDiagonal =
        neighbor.x !== currentNode.x && neighbor.y !== currentNode.y;
      const moveCost = isDiagonal ? 1.414 : 1;
      const tentativeG = currentNode.g + moveCost;

      const neighborInOpenSet = openSet.includes(neighbor);

      if (!neighborInOpenSet || tentativeG < neighbor.g) {
        neighbor.parent = currentNode;
        neighbor.g = tentativeG;
        neighbor.h = getOctileDistance(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;

        if (!neighborInOpenSet) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // Return empty if no path is found
  return [];
}
