import type { Waypoint, WaypointNode } from "./types";

/**
 * Calculates Euclidean 3D distance between two points.
 */
function getDistance3D(
  posA: { x: number; y: number; z: number },
  posB: { x: number; y: number; z: number },
): number {
  return Math.sqrt(
    Math.pow(posA.x - posB.x, 2) +
      Math.pow(posA.y - posB.y, 2) +
      Math.pow(posA.z - posB.z, 2),
  );
}

/**
 * Finds the closest Waypoint in a list to a target 3D world position.
 */
export function findClosestWaypoint(
  waypoints: Waypoint[],
  pos: { x: number; y: number; z: number },
): Waypoint | null {
  if (waypoints.length === 0) return null;

  let closest = waypoints[0]!;
  let minDist = getDistance3D(closest, pos);

  for (let i = 1; i < waypoints.length; i++) {
    const wp = waypoints[i]!;
    const dist = getDistance3D(wp, pos);
    if (dist < minDist) {
      minDist = dist;
      closest = wp;
    }
  }

  return closest;
}

/**
 * Runs A* pathfinding on a network of 3D Waypoints.
 *
 * @param waypoints List of all waypoints in the road network.
 * @param startWorldPos Player's current 3D world position.
 * @param endWorldPos Targeted 3D world destination.
 * @returns Array of Waypoints representing the path from start to end, or empty array if none found.
 */
export function findWaypointPath(
  waypoints: Waypoint[],
  startWorldPos: { x: number; y: number; z: number },
  endWorldPos: { x: number; y: number; z: number },
): Waypoint[] {
  if (waypoints.length === 0) return [];

  // 1. Find the closest starting and ending waypoints in the network
  const startWp = findClosestWaypoint(waypoints, startWorldPos);
  const endWp = findClosestWaypoint(waypoints, endWorldPos);

  if (!startWp || !endWp) return [];
  if (startWp.id === endWp.id) return [startWp];

  // 2. Map all waypoints to A* search nodes
  const nodeMap = new Map<number, WaypointNode>();
  waypoints.forEach((wp) => {
    nodeMap.set(wp.id, {
      ...wp,
      g: Infinity,
      h: Infinity,
      f: Infinity,
      parent: null,
    });
  });

  const startNode = nodeMap.get(startWp.id)!;
  const endNode = nodeMap.get(endWp.id)!;

  // 3. Initialize open and closed sets
  const openSet: WaypointNode[] = [startNode];
  const closedSet = new Set<number>(); // Set of waypoint IDs

  startNode.g = 0;
  startNode.h = getDistance3D(startNode, endNode);
  startNode.f = startNode.h;

  while (openSet.length > 0) {
    // Find node with lowest f score
    let lowIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      const node = openSet[i]!;
      const lowNode = openSet[lowIndex]!;
      if (node.f < lowNode.f) {
        lowIndex = i;
      }
    }

    const currentNode = openSet[lowIndex]!;

    // Reached destination! Reconstruct the path
    if (currentNode.id === endNode.id) {
      const path: Waypoint[] = [];
      let temp: WaypointNode | null = currentNode;
      while (temp !== null) {
        // Find corresponding raw Waypoint
        const rawWp = waypoints.find((w) => w.id === temp!.id);
        if (rawWp) {
          path.push(rawWp);
        }
        temp = temp.parent;
      }
      return path.reverse();
    }

    // Move from open to closed set
    openSet.splice(lowIndex, 1);
    closedSet.add(currentNode.id);

    // Process neighbors
    for (const neighborId of currentNode.connections) {
      if (closedSet.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) continue;

      // Distance from currentNode to neighbor is physical 3D distance
      const tentativeG =
        currentNode.g + getDistance3D(currentNode, neighborNode);

      const neighborInOpenSet = openSet.some((node) => node.id === neighborId);

      if (!neighborInOpenSet || tentativeG < neighborNode.g) {
        neighborNode.parent = currentNode;
        neighborNode.g = tentativeG;
        neighborNode.h = getDistance3D(neighborNode, endNode);
        neighborNode.f = neighborNode.g + neighborNode.h;

        if (!neighborInOpenSet) {
          openSet.push(neighborNode);
        }
      }
    }
  }

  // No path found
  return [];
}
