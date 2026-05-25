import * as THREE from "three";
import { TERRAIN_COLORS } from "@/data/world/terrainConfig";
import type {
  TerrainSurfaceBounds,
  TerrainSurfaceProjectionConfig,
  TerrainSurfaceRgb,
  TerrainSurfaceSample,
  TerrainSurfaceUv,
} from "@/types/world/terrainSurface";
import { getTerrainColorKeyFromRgb } from "@/utils/world/terrainSurfaceColor";

type TerrainSurfaceImageSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap;

const imageDataCache = new WeakMap<TerrainSurfaceImageSource, ImageData>();
function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function wrap01(value: number): number {
  return ((value % 1) + 1) % 1;
}

function isTerrainSurfaceImageSource(
  value: unknown,
): value is TerrainSurfaceImageSource {
  return (
    value instanceof HTMLImageElement ||
    value instanceof HTMLCanvasElement ||
    (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap)
  );
}

export function createTerrainSurfaceImageData(
  texture: THREE.Texture,
): ImageData | null {
  if (typeof document === "undefined") return null;

  const image = texture.image as unknown;
  if (!isTerrainSurfaceImageSource(image)) return null;

  const cachedImageData = imageDataCache.get(image);
  if (cachedImageData) return cachedImageData;

  const width = image.width;
  const height = image.height;
  if (width <= 0 || height <= 0) return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  imageDataCache.set(image, imageData);
  return imageData;
}

export function sampleTerrainSurfaceAtUv(
  imageData: ImageData,
  uv: TerrainSurfaceUv,
): TerrainSurfaceSample {
  const x = Math.round(clamp01(uv.u) * (imageData.width - 1));
  const y = Math.round((1 - clamp01(uv.v)) * (imageData.height - 1));
  const index = (y * imageData.width + x) * 4;

  const rgb: TerrainSurfaceRgb = [
    imageData.data[index] ?? 0,
    imageData.data[index + 1] ?? 0,
    imageData.data[index + 2] ?? 0,
  ];
  const key = getTerrainColorKeyFromRgb(rgb[0], rgb[1], rgb[2]);

  return {
    rgb,
    key,
    config: key === null ? null : TERRAIN_COLORS[key],
  };
}

export function terrainSurfaceUvFromXZ(
  x: number,
  z: number,
  bounds: TerrainSurfaceBounds,
  projection?: TerrainSurfaceProjectionConfig,
): TerrainSurfaceUv {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  let u = width === 0 ? 0 : x / width + 0.5;
  let v = depth === 0 ? 0 : z / depth + 0.5;

  if (projection?.flipX) {
    u = 1 - u;
  }

  if (projection?.flipZ) {
    v = 1 - v;
  }

  u = wrap01(u + (projection?.offsetX ?? 0));
  v = wrap01(v + (projection?.offsetZ ?? 0));

  return {
    u,
    v,
  };
}

export function sampleTerrainSurfaceAtXZ(
  imageData: ImageData,
  x: number,
  z: number,
  bounds: TerrainSurfaceBounds,
  projection?: TerrainSurfaceProjectionConfig,
): TerrainSurfaceSample {
  return sampleTerrainSurfaceAtUv(
    imageData,
    terrainSurfaceUvFromXZ(x, z, bounds, projection),
  );
}
