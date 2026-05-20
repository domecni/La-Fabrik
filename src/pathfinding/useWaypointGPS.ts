import { useState, useEffect, useCallback, useRef } from 'react';
import { findWaypointPath } from './WaypointAStar';
import type { Waypoint } from './types';
import type { WorldBounds } from './useGPS';

export interface UseWaypointGPSOptions {
  roadNetworkUrl: string; // URL/Path to roadNetwork.json
  colorMapUrl: string;    // URL/Path to color_map.png
  worldBounds: WorldBounds;
}

export function useWaypointGPS({
  roadNetworkUrl,
  colorMapUrl,
  worldBounds,
}: UseWaypointGPSOptions) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const colorMapImgRef = useRef<HTMLImageElement | null>(null);

  // Load waypoint list and background color map image
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function initGPS() {
      try {
        // 1. Fetch the road network JSON
        const response = await fetch(roadNetworkUrl);
        if (!response.ok) {
          throw new Error(`Failed to load road network from ${roadNetworkUrl}`);
        }
        const data: Waypoint[] = await response.json();

        // 2. Pre-load the color map image
        const colorMapImg = new Image();
        colorMapImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          colorMapImg.onload = resolve;
          colorMapImg.onerror = reject;
          colorMapImg.src = colorMapUrl;
        });

        if (active) {
          setWaypoints(data);
          colorMapImgRef.current = colorMapImg;
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to initialize Waypoint GPS');
          setLoading(false);
        }
      }
    }

    initGPS();

    return () => {
      active = false;
    };
  }, [roadNetworkUrl, colorMapUrl]);

  /**
   * Calculates the shortest path between start and end world points.
   */
  const calculateRoute = useCallback(
    (
      startWorld: { x: number; y: number; z: number },
      endWorld: { x: number; y: number; z: number }
    ): Waypoint[] => {
      if (waypoints.length === 0) return [];
      return findWaypointPath(waypoints, startWorld, endWorld);
    },
    [waypoints]
  );

  /**
   * Renders the road network path, player position, and waypoint target onto a canvas.
   */
  const renderGPSToCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      path: Waypoint[],
      playerWorldPos?: { x: number; y: number; z: number },
      destWorldPos?: { x: number; y: number; z: number },
      options: {
        pathColor?: string;
        pathWidth?: number;
        playerColor?: string;
        playerSize?: number;
        destColor?: string;
        destSize?: number;
        showAllWaypoints?: boolean; // Debug mode
      } = {}
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !colorMapImgRef.current) return;

      const {
        pathColor = '#10b981', // Premium emerald green
        pathWidth = 6,
        playerColor = '#ff0055', // Neon pink-red for bike
        playerSize = 8,
        destColor = '#00ffcc', // Neon cyan for target
        destSize = 8,
        showAllWaypoints = false,
      } = options;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // 1. Draw color map background
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(colorMapImgRef.current, 0, 0, canvasWidth, canvasHeight);

      // Helper: translate world coordinates (X, Z) to Canvas pixels (x, y)
      const worldToCanvas = (wx: number, wz: number) => {
        const { minX, maxX, minZ, maxZ } = worldBounds;
        const px = ((wx - minX) / (maxX - minX)) * canvasWidth;
        const py = ((wz - minZ) / (maxZ - minZ)) * canvasHeight;
        return { x: px, y: py };
      };

      // 2. [Debug] Draw all network connections
      if (showAllWaypoints && waypoints.length > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        const drawn = new Set<string>();

        waypoints.forEach((wp) => {
          const startPt = worldToCanvas(wp.x, wp.z);
          wp.connections.forEach((connId) => {
            const other = waypoints.find((w) => w.id === connId);
            if (other) {
              const key = wp.id < other.id ? `${wp.id}-${other.id}` : `${other.id}-${wp.id}`;
              if (!drawn.has(key)) {
                drawn.add(key);
                const endPt = worldToCanvas(other.x, other.z);
                ctx.beginPath();
                ctx.moveTo(startPt.x, startPt.y);
                ctx.lineTo(endPt.x, endPt.y);
                ctx.stroke();
              }
            }
          });
        });
      }

      // 3. Draw calculated A* path line
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
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add soft premium path glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = pathColor;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      }

      // 4. Draw Destination target
      if (destWorldPos) {
        const destPt = worldToCanvas(destWorldPos.x, destWorldPos.z);
        ctx.beginPath();
        ctx.arc(destPt.x, destPt.y, destSize, 0, 2 * Math.PI);
        ctx.fillStyle = destColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }

      // 5. Draw Player / Bike
      if (playerWorldPos) {
        const playerPt = worldToCanvas(playerWorldPos.x, playerWorldPos.z);
        ctx.beginPath();
        ctx.arc(playerPt.x, playerPt.y, playerSize, 0, 2 * Math.PI);
        ctx.fillStyle = playerColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }
    },
    [worldBounds, waypoints]
  );

  return {
    waypoints,
    loading,
    error,
    calculateRoute,
    renderGPSToCanvas,
  };
}
