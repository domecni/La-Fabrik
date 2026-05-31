import React, { useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MapControls, OrthographicCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { MapControls as MapControlsImpl } from "three-stdlib";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
interface WaypointData {
  id: number;
  x: number;
  y: number;
  z: number;
  connections: number[];
}

interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// Extend window for global functions
declare global {
  interface Window {
    applyAutoBounds?: () => void;
    downloadMapScreenshot?: () => void;
  }
}

// ----------------------------------------------------------------------------
// 1. Terrain Scene
// ----------------------------------------------------------------------------
function TerrainScene() {
  const { scene } = useGLTF("/models/terrain/terrain.glb");
  return (
    <group>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2} />
      <primitive object={scene} />
    </group>
  );
}

// ----------------------------------------------------------------------------
// 2. Waypoint Overlay (Debug visualization)
// ----------------------------------------------------------------------------
function WaypointOverlay({
  waypoints,
  visible,
}: {
  waypoints: WaypointData[];
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <group>
      {waypoints.map((w) => (
        <mesh key={w.id} position={[w.x, w.y + 1, w.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3. Camera Manager (Handles Orthographic Math & Downloads)
// ----------------------------------------------------------------------------
function CameraManager({
  autoBounds,
  boundsTextRef,
}: {
  autoBounds: Bounds | null;
  boundsTextRef: React.RefObject<HTMLPreElement | null>;
}) {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<MapControlsImpl>(null);
  // Use refs to store mutable camera properties that we need to modify
  const cameraRef = useRef(camera);

  // Update cameraRef in an effect to avoid refs during render error
  React.useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Apply Auto-Bounds function using useCallback to create a stable reference
  const applyAutoBounds = useCallback(() => {
    const cam = cameraRef.current;
    if (cam instanceof THREE.OrthographicCamera && autoBounds) {
      const width = autoBounds.maxX - autoBounds.minX;
      const height = autoBounds.maxZ - autoBounds.minZ;
      const centerX = (autoBounds.minX + autoBounds.maxX) / 2;
      const centerZ = (autoBounds.minZ + autoBounds.maxZ) / 2;

      cam.position.set(centerX, 200, centerZ);
      cam.left = -width / 2;
      cam.right = width / 2;
      cam.top = height / 2;
      cam.bottom = -height / 2;
      cam.zoom = 1;
      cam.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.set(centerX, 0, centerZ);
        controlsRef.current.update();
      }
    }
  }, [autoBounds]);

  // Initial apply on autoBounds change (using useFrame to run once after mount)
  const hasAppliedRef = useRef(false);
  useFrame(() => {
    if (!hasAppliedRef.current && autoBounds) {
      applyAutoBounds();
      hasAppliedRef.current = true;
    }
  });

  // Reset hasApplied when autoBounds changes
  React.useEffect(() => {
    hasAppliedRef.current = false;
    window.applyAutoBounds = applyAutoBounds;
    return () => {
      delete window.applyAutoBounds;
    };
  }, [applyAutoBounds]);

  // Track dynamic bounds without triggering React re-renders!
  useFrame(() => {
    const cam = cameraRef.current;
    if (cam instanceof THREE.OrthographicCamera && boundsTextRef.current) {
      const width = (cam.right - cam.left) / cam.zoom;
      const height = (cam.top - cam.bottom) / cam.zoom;
      const minX = Math.round(cam.position.x - width / 2);
      const maxX = Math.round(cam.position.x + width / 2);
      const minZ = Math.round(cam.position.z - height / 2);
      const maxZ = Math.round(cam.position.z + height / 2);

      // Direct DOM mutation for 60fps performance (prevents WebGL Context Lost!)
      boundsTextRef.current.innerText = JSON.stringify(
        { minX, maxX, minZ, maxZ },
        null,
        2,
      );
    }
  });

  // Attach screenshot capture logic
  React.useEffect(() => {
    window.downloadMapScreenshot = () => {
      // Force an immediate render frame to ensure no UI overlays are missing
      gl.render(scene, cameraRef.current);
      const dataUrl = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "map_background.png";
      a.click();
    };
    return () => {
      delete window.downloadMapScreenshot;
    };
  }, [gl, scene]);

  return (
    <MapControls ref={controlsRef} enableRotate={false} dampingFactor={0.05} />
  );
}

// ----------------------------------------------------------------------------
// 4. Main Page Route Component
// ----------------------------------------------------------------------------
export function BackgroundMapPage() {
  // Use lazy initialization to avoid setState in useEffect
  const [waypoints, setWaypoints] = useState<WaypointData[]>(() => {
    const saved = localStorage.getItem("la-fabrik-waypoints");
    if (saved) {
      try {
        return JSON.parse(saved) as WaypointData[];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [showWaypoints, setShowWaypoints] = useState(true);
  const boundsTextRef = useRef<HTMLPreElement>(null);
  const hasFetchedRef = useRef(false);

  // Fetch from network as fallback if localStorage was empty
  React.useEffect(() => {
    if (waypoints.length === 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetch("/roadNetwork.json")
        .then((res) => res.json())
        .then((data: WaypointData[]) => setWaypoints(data))
        .catch(() => {});
    }
  }, [waypoints.length]); // Include dependency to satisfy linter

  // Compute exact bounds that the EbikeGPSMap will use by default
  const autoBounds = useMemo((): Bounds | null => {
    if (waypoints.length === 0) return null;
    const xs = waypoints.map((w) => w.x);
    const zs = waypoints.map((w) => w.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    // CRITICAL: We MUST force the camera bounds to be a PERFECT SQUARE.
    // If the camera is rectangular, the exported PNG will be distorted when drawn
    // on the EbikeGPSMap's 1024x1024 canvas!
    const width = maxX - minX;
    const height = maxZ - minZ;
    const maxDim = Math.max(width, height);

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const paddedDim = maxDim * 1.15 || 100;

    return {
      minX: centerX - paddedDim / 2,
      maxX: centerX + paddedDim / 2,
      minZ: centerZ - paddedDim / 2,
      maxZ: centerZ + paddedDim / 2,
    };
  }, [waypoints]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#050505",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 
        CRITICAL: The DOM element MUST be a perfect square so the resulting PNG 
        is exactly 1:1, preventing stretching in the EbikeGPSMap canvas texture! 
      */}
      <div
        style={{
          width: "min(100vw, 100vh)",
          height: "min(100vw, 100vh)",
          background: "#000",
          position: "relative",
        }}
      >
        <Canvas
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
        >
          <OrthographicCamera
            makeDefault
            position={[0, 200, 0]}
            near={0.1}
            far={1000}
          />
          <TerrainScene />
          <WaypointOverlay waypoints={waypoints} visible={showWaypoints} />
          <CameraManager
            autoBounds={autoBounds}
            boundsTextRef={boundsTextRef}
          />
        </Canvas>
      </div>

      {/* Premium Glassmorphic UI Dashboard */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "rgba(15, 23, 42, 0.85)",
          padding: 24,
          borderRadius: 16,
          border: "1px solid #334155",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(12px)",
          width: 360,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        <h2
          style={{ margin: "0 0 16px 0", fontSize: "1.4rem", color: "#38bdf8" }}
        >
          GPS Map Generator
        </h2>

        <p
          style={{
            fontSize: "0.9rem",
            color: "#94a3b8",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          1. Cadrez votre carte (ou utilisez le <b>Cadrage Automatique</b>).
          <br />
          2. Masquez les waypoints (fond visuel seul).
          <br />
          3. Cliquez sur <b>Capturer la carte</b>.
        </p>

        <button
          onClick={() => setShowWaypoints(!showWaypoints)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: 12,
            background: showWaypoints ? "#1e293b" : "#334155",
            border: "1px solid #475569",
            color: "white",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          {showWaypoints ? "Masquer Waypoints" : "Afficher Waypoints"}
        </button>

        <button
          onClick={() => {
            if (window.applyAutoBounds) window.applyAutoBounds();
          }}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: 16,
            background: "#1e293b",
            border: "1px solid #475569",
            color: "#10b981",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          Cadrage Automatique
        </button>

        <button
          onClick={() => {
            if (window.downloadMapScreenshot) window.downloadMapScreenshot();
          }}
          style={{
            width: "100%",
            padding: "14px",
            background: "#0ea5e9",
            border: "none",
            color: "white",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.4)",
          }}
        >
          Capturer la carte (.png)
        </button>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#020617",
            borderRadius: 10,
            fontSize: "0.85rem",
          }}
        >
          <div style={{ color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
            Limites Actuelles (worldBounds):
          </div>
          <pre
            ref={boundsTextRef}
            style={{ margin: 0, color: "#10b981", fontFamily: "monospace" }}
          >
            Calcul...
          </pre>
          <div
            style={{
              color: "#ef4444",
              marginTop: 12,
              fontSize: "0.75rem",
              lineHeight: 1.4,
            }}
          >
            *Si vous décadrez à la souris, vous devrez copier ces valeurs
            exactes dans la prop <code>worldBounds</code> de votre composant{" "}
            <b>EbikeGPSMap</b> !
            <br />
            <br />
            Astuce : Utilisez le <b>Cadrage Automatique</b> pour ne rien avoir à
            configurer.
          </div>
        </div>
      </div>
    </div>
  );
}
