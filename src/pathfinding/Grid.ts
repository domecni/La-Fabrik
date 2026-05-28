import type { GridNode } from "./types";

export class Grid {
  public width: number;
  public height: number;
  private nodes: GridNode[][];

  constructor(walkableMatrix: boolean[][]) {
    this.height = walkableMatrix.length;
    this.width = this.height > 0 ? (walkableMatrix[0]?.length ?? 0) : 0;
    this.nodes = [];

    for (let y = 0; y < this.height; y++) {
      const row: GridNode[] = [];
      const sourceRow = walkableMatrix[y];
      for (let x = 0; x < this.width; x++) {
        row.push({
          x,
          y,
          walkable: sourceRow ? (sourceRow[x] ?? false) : false,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
        });
      }
      this.nodes.push(row);
    }
  }

  public getNode(x: number, y: number): GridNode | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const row = this.nodes[y];
      return row ? (row[x] ?? null) : null;
    }
    return null;
  }

  /**
   * Resets g, h, f values and parents for all nodes in the grid,
   * preparing it for a new A* calculation.
   */
  public reset(): void {
    for (let y = 0; y < this.height; y++) {
      const row = this.nodes[y];
      if (!row) continue;
      for (let x = 0; x < this.width; x++) {
        const node = row[x];
        if (!node) continue;
        node.g = 0;
        node.h = 0;
        node.f = 0;
        node.parent = null;
      }
    }
  }

  /**
   * Retrieves neighboring nodes. Supports 8-directional movement.
   */
  public getNeighbors(
    node: GridNode,
    allowDiagonals: boolean = true,
  ): GridNode[] {
    const neighbors: GridNode[] = [];
    const { x, y } = node;

    // Relative coordinates of 8 neighbors
    const directions = [
      { dx: 0, dy: -1, isDiagonal: false }, // N
      { dx: 1, dy: 0, isDiagonal: false }, // E
      { dx: 0, dy: 1, isDiagonal: false }, // S
      { dx: -1, dy: 0, isDiagonal: false }, // W
    ];

    if (allowDiagonals) {
      directions.push(
        { dx: 1, dy: -1, isDiagonal: true }, // NE
        { dx: 1, dy: 1, isDiagonal: true }, // SE
        { dx: -1, dy: 1, isDiagonal: true }, // SW
        { dx: -1, dy: -1, isDiagonal: true }, // NW
      );
    }

    for (const dir of directions) {
      const neighbor = this.getNode(x + dir.dx, y + dir.dy);
      if (neighbor && neighbor.walkable) {
        // Prevent corner cutting if both orthogonal neighbors are blocked
        if (dir.isDiagonal) {
          const ortho1 = this.getNode(x + dir.dx, y);
          const ortho2 = this.getNode(x, y + dir.dy);
          const isBlocked =
            (!ortho1 || !ortho1.walkable) && (!ortho2 || !ortho2.walkable);
          if (isBlocked) {
            continue; // Skip this diagonal neighbor to avoid squeezing through corners
          }
        }
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }
}
