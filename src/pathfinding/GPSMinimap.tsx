import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGPS } from './useGPS';
import type { WorldBounds } from './useGPS';

// ==========================================
// 1. Premium 2D HUD GPS Overlay Component
// ==========================================

export interface GPSMinimapHUDProps {
  bwMaskUrl: string;
  colorMapUrl: string;
  gridWidth: number;
  gridHeight: number;
  worldBounds: WorldBounds;
  playerPos: { x: number; z: number };
  destPos?: { x: number; z: number };
  size?: number; // Size of HUD in pixels
}

/**
 * A beautiful, glassmorphic 2D HUD overlay that renders the GPS Minimap
 * in the corner of the screen.
 */
export const GPSMinimapHUD: React.FC<GPSMinimapHUDProps> = ({
  bwMaskUrl,
  colorMapUrl,
  gridWidth,
  gridHeight,
  worldBounds,
  playerPos,
  destPos,
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const gpsOptions = useMemo(() => ({
    bwMaskUrl,
    colorMapUrl,
    gridWidth,
    gridHeight,
    worldBounds,
  }), [bwMaskUrl, colorMapUrl, gridWidth, gridHeight, worldBounds]);

  const { calculateWorldPath, renderGPSToCanvas, loading, error } = useGPS(gpsOptions);

  useEffect(() => {
    if (loading || error || !canvasRef.current) return;

    // Calculate A* path in world coordinates
    const path = destPos ? calculateWorldPath(playerPos, destPos) : [];

    // Render path onto HUD canvas
    renderGPSToCanvas(canvasRef.current, path, playerPos, destPos, {
      pathColor: '#3b82f6', // Premium vibrant blue
      pathWidth: 5,
      playerColor: '#ef4444', // Hot red for player
      playerSize: 6,
      destColor: '#10b981', // Emerald green for destination
      destSize: 6,
    });
  }, [playerPos, destPos, loading, error, calculateWorldPath, renderGPSToCanvas]);

  return (
    <div style={hudStyles.container(size)}>
      {loading && <div style={hudStyles.statusText}>Initializing GPS...</div>}
      {error && <div style={{ ...hudStyles.statusText, color: '#ef4444' }}>GPS Error: {error}</div>}
      
      {!loading && !error && (
        <canvas
          ref={canvasRef}
          width={size * 2} // Double size for retina/high-DPI screens
          height={size * 2}
          style={hudStyles.canvas(size)}
        />
      )}
    </div>
  );
};

// ==========================================
// 2. 3D Handlebar Screen Mesh Component (R3F)
// ==========================================

export interface GPSBikeScreenProps {
  bwMaskUrl: string;
  colorMapUrl: string;
  gridWidth: number;
  gridHeight: number;
  worldBounds: WorldBounds;
  playerPos: { x: number; z: number };
  destPos?: { x: number; z: number };
  width?: number; // 3D Plane Width
  height?: number; // 3D Plane Height
}

/**
 * A Three.js 3D plane mesh that renders the GPS dynamically as a CanvasTexture.
 * This can be directly attached to the bike's handlebars in your 3D world.
 */
export const GPSBikeScreen: React.FC<GPSBikeScreenProps> = ({
  bwMaskUrl,
  colorMapUrl,
  gridWidth,
  gridHeight,
  worldBounds,
  playerPos,
  destPos,
  width = 0.4,
  height = 0.4,
}) => {
  // Offscreen canvas to render the GPS texture onto
  const [offscreenCanvas] = useState(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    return canvas;
  });

  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const gpsOptions = useMemo(() => ({
    bwMaskUrl,
    colorMapUrl,
    gridWidth,
    gridHeight,
    worldBounds,
  }), [bwMaskUrl, colorMapUrl, gridWidth, gridHeight, worldBounds]);

  const { calculateWorldPath, renderGPSToCanvas, loading } = useGPS(gpsOptions);

  useEffect(() => {
    if (loading) return;

    // Calculate A* path
    const path = destPos ? calculateWorldPath(playerPos, destPos) : [];

    // Render path onto our offscreen canvas
    renderGPSToCanvas(offscreenCanvas, path, playerPos, destPos, {
      pathColor: '#60a5fa', // Bright neon blue
      pathWidth: 8,
      playerColor: '#ff0055', // Neon pink-red for bike
      playerSize: 10,
      destColor: '#00ffcc', // Vibrant cyan for target
      destSize: 10,
    });

    // Notify Three.js that the texture needs an update
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [playerPos, destPos, loading, calculateWorldPath, renderGPSToCanvas, offscreenCanvas]);

  return (
    <mesh castShadow receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial toneMapped={false}>
        <canvasTexture
          ref={textureRef}
          attach="map"
          image={offscreenCanvas}
          minFilter={THREE.LinearFilter}
          magFilter={THREE.LinearFilter}
        />
      </meshBasicMaterial>
    </mesh>
  );
};

// ==========================================
// Styles for HUD (Premium Glassmorphism)
// ==========================================

const hudStyles = {
  container: (size: number): React.CSSProperties => ({
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 15px rgba(59, 130, 246, 0.2)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: 'rgba(15, 23, 42, 0.6)', // Sleek dark slate
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  canvas: (size: number): React.CSSProperties => ({
    width: `${size}px`,
    height: `${size}px`,
    display: 'block',
  }),
  statusText: {
    color: '#94a3b8',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
};
