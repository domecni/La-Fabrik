import { Grid } from "./Grid";

/**
 * Loads an image from a URL.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS just in case
    img.onload = () => resolve(img);
    img.onerror = (err) =>
      reject(new Error(`Failed to load image at ${url}: ${err}`));
    img.src = url;
  });
}

/**
 * Loads a B&W image and scales it to gridWidth x gridHeight.
 * Higher dimensions = higher accuracy but slower pathfinding.
 * Lower dimensions = extremely fast pathfinding.
 *
 * Walkable roads should be white (or light gray). Non-walkable areas should be black.
 *
 * @param imageUrl The path or URL of the B&W navigation mask.
 * @param gridWidth The target width of our A* pathfinding grid.
 * @param gridHeight The target height of our A* pathfinding grid.
 * @param threshold Brightness threshold (0-255) above which a pixel is considered walkable (default: 128).
 */
export async function createGridFromImage(
  imageUrl: string,
  gridWidth: number,
  gridHeight: number,
  threshold: number = 128,
): Promise<Grid> {
  const img = await loadImage(imageUrl);

  // Create an offscreen canvas to scale and analyze the image
  const canvas = document.createElement("canvas");
  canvas.width = gridWidth;
  canvas.height = gridHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get 2D context for offscreen canvas");
  }

  // Draw and scale the image onto the canvas
  ctx.drawImage(img, 0, 0, gridWidth, gridHeight);

  // Retrieve pixel data
  const imgData = ctx.getImageData(0, 0, gridWidth, gridHeight);
  const data = imgData.data;

  // Initialize a 2D boolean matrix representing the walkable grid
  const walkableMatrix: boolean[][] = [];

  for (let y = 0; y < gridHeight; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < gridWidth; x++) {
      // Each pixel has 4 channels: R, G, B, A
      const index = (y * gridWidth + x) * 4;
      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;

      // Calculate brightness (standard grayscale weighting)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      // If bright enough, it is a road (walkable)
      row.push(brightness >= threshold);
    }
    walkableMatrix.push(row);
  }

  return new Grid(walkableMatrix);
}
