import { useState, useEffect, useCallback, useRef } from "react";
import { Grid } from "./Grid";
import { createGridFromImage } from "./ImageToGrid";
import { findPath } from "./AStar";
import type { Position } from "./types";

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface UseGPSOptions {
  bwMaskUrl: string;
  colorMapUrl: string;
  gridWidth: number; // The "width of the array pathfinding" (resolution scaling)
  gridHeight: number; // The "height of the array pathfinding"
  worldBounds: WorldBounds;
  allowDiagonals?: boolean;
}

export function useGPS({
  bwMaskUrl,
  colorMapUrl,
  gridWidth,
  gridHeight,
  worldBounds,
  allowDiagonals = true,
}: UseGPSOptions) {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cache the images so they don't reload every frame
  const colorMapImgRef = useRef<HTMLImageElement | null>(null);

  // Initialize the pathfinding grid
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function initGrid() {
      try {
        const pathfindingGrid = await createGridFromImage(
          bwMaskUrl,
          gridWidth,
          gridHeight,
        );

        // Pre-load color map image for canvas drawing
        const colorMapImg = new Image();
        colorMapImg.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          colorMapImg.onload = resolve;
          colorMapImg.onerror = reject;
          colorMapImg.src = colorMapUrl;
        });

        if (active) {
          setGrid(pathfindingGrid);
          colorMapImgRef.current = colorMapImg;
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to initialize GPS system");
          setLoading(false);
        }
      }
    }

    initGrid();

    return () => {
      active = false;
    };
  }, [bwMaskUrl, colorMapUrl, gridWidth, gridHeight]);

  /**
   * Translates 3D World coordinates (X, Z) into 2D Grid coordinates (col, row)
   */
  const worldToGrid = useCallback(
    (worldX: number, worldZ: number): Position => {
      const { minX, maxX, minZ, maxZ } = worldBounds;

      // Calculate percentages across the bounds
      const pctX = (worldX - minX) / (maxX - minX);
      const pctZ = (worldZ - minZ) / (maxZ - minZ);

      // Map to grid dimensions
      const gridX = Math.max(
        0,
        Math.min(gridWidth - 1, Math.floor(pctX * gridWidth)),
      );
      const gridY = Math.max(
        0,
        Math.min(gridHeight - 1, Math.floor(pctZ * gridHeight)),
      );

      return { x: gridX, y: gridY };
    },
    [worldBounds, gridWidth, gridHeight],
  );

  /**
   * Translates 2D Grid coordinates (col, row) back into 3D World coordinates (X, Z)
   */
  const gridToWorld = useCallback(
    (gridX: number, gridY: number): { x: number; z: number } => {
      const { minX, maxX, minZ, maxZ } = worldBounds;

      const pctX = gridX / gridWidth;
      const pctZ = gridY / gridHeight;

      const worldX = minX + pctX * (maxX - minX);
      const worldZ = minZ + pctZ * (maxZ - minZ);

      return { x: worldX, z: worldZ };
    },
    [worldBounds, gridWidth, gridHeight],
  );

  /**
   * Runs the A* calculation using 3D world coordinates.
   * Returns path in 3D world space.
   */
  const calculateWorldPath = useCallback(
    (
      startWorld: { x: number; z: number },
      endWorld: { x: number; z: number },
    ): { x: number; z: number }[] => {
      if (!grid) return [];

      const startGrid = worldToGrid(startWorld.x, startWorld.z);
      const endGrid = worldToGrid(endWorld.x, endWorld.z);

      const gridPath = findPath(grid, startGrid, endGrid, allowDiagonals);

      // Convert path coordinates back to 3D space
      return gridPath.map((node) => gridToWorld(node.x, node.y));
    },
    [grid, worldToGrid, gridToWorld, allowDiagonals],
  );

  /**
   * Updates an HTML5 `<canvas>` element with the background color map,
   * a path line, and the player/destination indicators.
   */
  const renderGPSToCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      path: { x: number; z: number }[],
      playerWorldPos?: { x: number; z: number },
      destWorldPos?: { x: number; z: number },
      options: {
        pathColor?: string;
        pathWidth?: number;
        playerColor?: string;
        playerSize?: number;
        destColor?: string;
        destSize?: number;
      } = {},
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !colorMapImgRef.current) return;

      const {
        pathColor = "#3b82f6", // Premium blue
        pathWidth = 6,
        playerColor = "#ef4444", // Red dot for player
        playerSize = 8,
        destColor = "#10b981", // Green dot for flag
        destSize = 8,
      } = options;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // 1. Draw background color map
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(colorMapImgRef.current, 0, 0, canvasWidth, canvasHeight);

      // Helper: translate world coordinates to Canvas pixels
      const worldToCanvas = (wx: number, wz: number): Position => {
        const { minX, maxX, minZ, maxZ } = worldBounds;
        const px = ((wx - minX) / (maxX - minX)) * canvasWidth;
        const py = ((wz - minZ) / (maxZ - minZ)) * canvasHeight;
        return { x: px, y: py };
      };

      // 2. Draw A* Path Line
      if (path.length > 1) {
        ctx.beginPath();
        const startNode = path[0]!;
        const startPt = worldToCanvas(startNode.x, startNode.z);
        ctx.moveTo(startPt.x, startPt.y);

        for (let i = 1; i < path.length; i++) {
          const node = path[i]!;
          const pt = worldToCanvas(node.x, node.z);
          ctx.lineTo(pt.x, pt.y);
        }

        ctx.strokeStyle = pathColor;
        ctx.lineWidth = pathWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Add a soft glow effect for premium feel
        ctx.shadowBlur = 8;
        ctx.shadowColor = pathColor;
        ctx.stroke();

        // Reset shadow for subsequent drawings
        ctx.shadowBlur = 0;
      }

      // 3. Draw Destination Indicator
      if (destWorldPos) {
        const destPt = worldToCanvas(destWorldPos.x, destWorldPos.z);
        ctx.beginPath();
        ctx.arc(destPt.x, destPt.y, destSize, 0, 2 * Math.PI);
        ctx.fillStyle = destColor;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }

      // 4. Draw Player Indicator
      if (playerWorldPos) {
        const playerPt = worldToCanvas(playerWorldPos.x, playerWorldPos.z);
        ctx.beginPath();
        ctx.arc(playerPt.x, playerPt.y, playerSize, 0, 2 * Math.PI);
        ctx.fillStyle = playerColor;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }
    },
    [worldBounds],
  );

  return {
    grid,
    loading,
    error,
    calculateWorldPath,
    renderGPSToCanvas,
    worldToGrid,
    gridToWorld,
  };
}
