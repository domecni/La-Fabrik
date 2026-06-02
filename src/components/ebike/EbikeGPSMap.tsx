import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as THREE from "three";
import {
  findClosestWaypoint,
  findWaypointPath,
} from "@/pathfinding/WaypointAStar";
import type { Waypoint } from "@/pathfinding/types";
import type { Vector3Tuple } from "@/types/three/three";

const VERT_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Circular Fresnel mask: fully visible inside innerRadius, fades out to outerRadius
const FRAG_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform float innerRadius;
  uniform float outerRadius;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(map, vUv);
    float dist = length(vUv - vec2(0.5));
    float mask = 1.0 - smoothstep(innerRadius, outerRadius, dist);
    gl_FragColor = vec4(color.rgb, color.a * mask);
  }
`;
function computeImageSource(
  img: HTMLImageElement | HTMLCanvasElement,
  baseBounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
) {
  const imgW = img.width;
  const imgH = img.height;

  const baseW = baseBounds.maxX - baseBounds.minX;
  const baseH = baseBounds.maxZ - baseBounds.minZ;

  if (baseW === 0 || baseH === 0) {
    return { sx: 0, sy: 0, sW: imgW, sH: imgH };
  }

  const sx = ((bounds.minX - baseBounds.minX) / baseW) * imgW;
  const sy = ((bounds.minZ - baseBounds.minZ) / baseH) * imgH;
  const sW = ((bounds.maxX - bounds.minX) / baseW) * imgW;
  const sH = ((bounds.maxZ - bounds.minZ) / baseH) * imgH;

  return { sx, sy, sW, sH };
}

export interface EbikeGPSMapProps {
  /**
   * 3D world position of the player/bike (GPS start point)
   * If omitted, snaps to [0,0,0]
   */
  startPos?: { x: number; y: number; z: number } | undefined;
  destPos?: { x: number; y: number; z: number } | undefined;

  /**
   * Optional custom URL to the map background texture.
   * If not provided, renders a high-tech minimalist neon blueprint map dynamically.
   */
  mapImageUrl?: string;

  /**
   * Optional explicit bounds for mapping coordinates.
   * If omitted, bounds are calculated automatically to perfectly fit the road network!
   */
  worldBounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };

  /**
   * Width of the 3D plane mesh (default: 1)
   */
  width?: number;

  /**
   * Height of the 3D plane mesh (default: 1)
   */
  height?: number;

  /**
   * Optional world position for the GPS screen (defaults to origin)
   */
  position?: Vector3Tuple;

  /**
   * Resolution of the offscreen canvas used for the map texture.
   * Higher values yield sharper rendering at the cost of GPU memory.
   * Default: 1024 (1024×1024 px)
   */
  canvasSize?: number;

  /**
   * Zoom level applied to the map view.
   * 1 = full world bounds, 2 = 2× zoom-in centred on the player, etc.
   * Values < 1 zoom out beyond the calculated world bounds.
   * Default: 1
   */
  zoom?: number;

  renderOrder?: number;
}

/**
 * EbikeGPSMap
 * A premium, state-of-the-art 3D GPS navigation screen for the Ebike.
 * Loads the road network, runs A* pathfinding, and renders a glowing, animated
 * orange path over a sleek high-tech map background.
 */
export const EbikeGPSMap: React.FC<EbikeGPSMapProps> = ({
  startPos = { x: 0, y: 0, z: 0 },
  destPos,
  mapImageUrl,
  worldBounds,
  width = 1,
  height = 1,
  position = [0, 0, 0],
  canvasSize = 1024,
  zoom = 1,
  renderOrder = 10_000,
}) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [mapImage, setMapImage] = useState<
    HTMLImageElement | HTMLCanvasElement | null
  >(null);

  // Offscreen high-res canvas for crystal clear rendering
  // Use useMemo to create canvas once - this is a stable reference that won't change
  const offscreenCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    return canvas;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Canvas should only be created once
  }, []);

  const animTimeRef = useRef<number>(0);

  // Imperative CanvasTexture — must be declared before the resize effect below
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(offscreenCanvas);
    tex.format = THREE.RGBAFormat;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [offscreenCanvas]);

  // ShaderMaterial with circular Fresnel mask (created once)
  const shaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: null },
          innerRadius: { value: 0.45 },
          outerRadius: { value: 0.5 },
        },
        vertexShader: VERT_SHADER,
        fragmentShader: FRAG_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );

  // Sync texture into uniform when it changes (canvas resize)
  useEffect(() => {
    shaderMat.uniforms.map.value = texture;
  }, [shaderMat, texture]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      shaderMat.dispose();
      texture.dispose();
    },
    [shaderMat, texture],
  );

  // Resize the canvas whenever canvasSize changes (texture declared above)
  useEffect(() => {
    Object.assign(offscreenCanvas, { width: canvasSize, height: canvasSize });
    texture.needsUpdate = true;
  }, [canvasSize, offscreenCanvas, texture]);

  // Load waypoints (localStorage with /roadNetwork.json fallback)
  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem("la-fabrik-waypoints");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Use queueMicrotask to avoid synchronous setState in effect
          queueMicrotask(() => {
            if (!cancelled) setWaypoints(parsed);
          });
          return;
        }
      } catch (e) {
        console.error(
          "[GPS Component] Error loading local storage waypoints",
          e,
        );
      }
    }

    // Fallback to static roadNetwork.json
    fetch("/roadNetwork.json")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not found");
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setWaypoints(data);
        }
      })
      .catch((err) => {
        console.log("[GPS Component] No default road network found.", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-load background map image (standard HTML5 Image loader)
  // Since the user's PNG is already transparent, we don't need fetch or pixel manipulation!
  useEffect(() => {
    if (!mapImageUrl) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setMapImage(null));
      return;
    }

    const img = new Image();
    img.onload = () => {
      setMapImage(img);
    };
    img.onerror = () => {
      console.warn(
        `[GPS Component] Failed to load map background image from ${mapImageUrl}. Falling back to dynamic vector map.`,
      );
      setMapImage(null);
    };
    img.src = mapImageUrl;
  }, [mapImageUrl]);

  // Determine grid boundaries (before zoom)
  const baseBounds = useMemo(() => {
    if (worldBounds) return worldBounds;

    if (waypoints.length === 0) {
      return { minX: -200, maxX: 200, minZ: -200, maxZ: 200 };
    }

    const xs = waypoints.map((w) => w.x);
    const zs = waypoints.map((w) => w.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    // Padding (15% to ensure full view breathing room)
    const padX = (maxX - minX) * 0.15 || 40;
    const padZ = (maxZ - minZ) * 0.15 || 40;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minZ: minZ - padZ,
      maxZ: maxZ + padZ,
    };
  }, [waypoints, worldBounds]);

  // Apply zoom: shrink the view window around the player position
  const bounds = useMemo(() => {
    const clampedZoom = Math.max(0.1, zoom);
    if (clampedZoom === 1) return baseBounds;

    const centerX = startPos.x;
    const centerZ = startPos.z;
    const halfW = (baseBounds.maxX - baseBounds.minX) / 2 / clampedZoom;
    const halfH = (baseBounds.maxZ - baseBounds.minZ) / 2 / clampedZoom;

    return {
      minX: centerX - halfW,
      maxX: centerX + halfW,
      minZ: centerZ - halfH,
      maxZ: centerZ + halfH,
    };
  }, [baseBounds, zoom, startPos]);

  // Snapped positions
  const startPosSnapped = useMemo(() => {
    if (waypoints.length === 0) return null;
    return findClosestWaypoint(waypoints, startPos);
  }, [waypoints, startPos]);

  const destPosSnapped = useMemo(() => {
    if (!destPos || waypoints.length === 0) return null;
    return findClosestWaypoint(waypoints, destPos);
  }, [waypoints, destPos]);

  // Calculated active A* route
  const activePath = useMemo(() => {
    if (!startPosSnapped || !destPosSnapped || waypoints.length === 0)
      return [];
    return findWaypointPath(waypoints, startPosSnapped, destPosSnapped);
  }, [waypoints, startPosSnapped, destPosSnapped]);

  // Translation helper: 3D world to Canvas pixels
  const worldToCanvas = useCallback(
    (wx: number, wz: number, size: number) => {
      const { minX, maxX, minZ, maxZ } = bounds;
      const px = ((wx - minX) / (maxX - minX)) * size;
      const py = ((wz - minZ) / (maxZ - minZ)) * size;
      return { x: px, y: py };
    },
    [bounds],
  );

  // Draw loop - returns true if texture needs update
  const draw = useCallback(() => {
    const canvas = offscreenCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
      alpha: true,
    });
    if (!ctx) return;

    const size = canvas.width;

    ctx.clearRect(0, 0, size, size);

    // 1. Draw Map Background (Image or premium blueprint vectors)
    if (mapImage) {
      const src = computeImageSource(mapImage, baseBounds, bounds);
      const sx = Math.max(0, Math.min(mapImage.width, src.sx));
      const sy = Math.max(0, Math.min(mapImage.height, src.sy));
      const sW = Math.max(1, Math.min(mapImage.width - sx, src.sW));
      const sH = Math.max(1, Math.min(mapImage.height - sy, src.sH));

      ctx.drawImage(mapImage, sx, sy, sW, sH, 0, 0, size, size);
      ctx.globalAlpha = 1.0;
    } else {
      // Dynamic Sci-fi background grid (Background is transparent!)

      // Sci-fi subgrid
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      const step = size / 32;
      for (let x = 0; x < size; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
      }
      for (let y = 0; y < size; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }

      // Aesthetic concentric radar topo-rings
      ctx.strokeStyle = "rgba(71, 85, 105, 0.06)";
      ctx.lineWidth = 2;
      for (let r = size / 6; r < size; r += size / 6) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Faint diagonal technical accents
      ctx.strokeStyle = "rgba(56, 189, 248, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(0, size);
      ctx.stroke();
    }

    // 2. Draw Active Orange Glowing Path (Neon Highway effect)
    if (activePath.length > 1) {
      // Pass 1: Wide transparent orange bloom
      ctx.beginPath();
      let pt = worldToCanvas(activePath[0]!.x, activePath[0]!.z, size);
      ctx.moveTo(pt.x, pt.y);
      for (let i = 1; i < activePath.length; i++) {
        pt = worldToCanvas(activePath[i]!.x, activePath[i]!.z, size);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(249, 115, 22, 0.2)"; // Faint bright orange
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#f97316"; // Neon Orange
      ctx.stroke();

      // Pass 2: Saturated glow core
      ctx.beginPath();
      pt = worldToCanvas(activePath[0]!.x, activePath[0]!.z, size);
      ctx.moveTo(pt.x, pt.y);
      for (let i = 1; i < activePath.length; i++) {
        pt = worldToCanvas(activePath[i]!.x, activePath[i]!.z, size);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "#f97316"; // Vibrant orange
      ctx.lineWidth = 8;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ea580c";
      ctx.stroke();

      // Pass 3: High-intensity white core
      ctx.beginPath();
      pt = worldToCanvas(activePath[0]!.x, activePath[0]!.z, size);
      ctx.moveTo(pt.x, pt.y);
      for (let i = 1; i < activePath.length; i++) {
        pt = worldToCanvas(activePath[i]!.x, activePath[i]!.z, size);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "#fff7ed"; // Cream white
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0; // Turn off shadows for the core
      ctx.stroke();

      // 3. Energy Particle Pulse animation tracing the road
      const segments: {
        start: { x: number; y: number };
        end: { x: number; y: number };
        len: number;
      }[] = [];
      let totalLen = 0;
      for (let i = 0; i < activePath.length - 1; i++) {
        const p1 = worldToCanvas(activePath[i]!.x, activePath[i]!.z, size);
        const p2 = worldToCanvas(
          activePath[i + 1]!.x,
          activePath[i + 1]!.z,
          size,
        );
        const len = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2),
        );
        segments.push({ start: p1, end: p2, len });
        totalLen += len;
      }

      if (totalLen > 0) {
        const targetLen = totalLen * animTimeRef.current;
        let currentLen = 0;
        let dotPt = segments[0]!.start;

        for (const seg of segments) {
          if (currentLen + seg.len >= targetLen) {
            const ratio = (targetLen - currentLen) / seg.len;
            dotPt = {
              x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
              y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
            };
            break;
          }
          currentLen += seg.len;
        }

        // Draw multiple glowing pulses along the path
        ctx.beginPath();
        ctx.arc(dotPt.x, dotPt.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#f97316";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // 4. Draw Snap Markers (Start and End)
    if (destPosSnapped) {
      const pt = worldToCanvas(destPosSnapped.x, destPosSnapped.z, size);
      const pulseSize = 12 + Math.sin(Date.now() * 0.007) * 4;

      // Pulse ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pulseSize, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Solid target core
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#ea580c"; // Deep target orange
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }

    if (startPosSnapped) {
      const pt = worldToCanvas(startPosSnapped.x, startPosSnapped.z, size);

      // Start Marker (Player Arrow/Dot)
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "#0ea5e9"; // Cool cyberpunk sky blue
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Tech details
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  }, [
    offscreenCanvas,
    mapImage,
    baseBounds,
    bounds,
    activePath,
    worldToCanvas,
    destPosSnapped,
    startPosSnapped,
  ]);

  // 60 FPS animation ticker
  useEffect(() => {
    let animId: number;
    const tick = () => {
      animTimeRef.current += 0.004;
      if (animTimeRef.current > 1) animTimeRef.current = 0;
      draw();
      texture.needsUpdate = true;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [draw, texture]);

  return (
    <mesh position={position} renderOrder={renderOrder}>
      <planeGeometry args={[width, height]} />
      <primitive object={shaderMat} attach="material" />
    </mesh>
  );
};
