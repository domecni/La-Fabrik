import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MapControls, OrthographicCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";

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
  waypoints: any[];
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
  autoBounds: any;
  boundsTextRef: React.RefObject<HTMLPreElement | null>;
}) {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<any>(null);

  // Apply Auto-Bounds function
  useEffect(() => {
    const applyAutoBounds = () => {
      if (camera instanceof THREE.OrthographicCamera && autoBounds) {
        const width = autoBounds.maxX - autoBounds.minX;
        const height = autoBounds.maxZ - autoBounds.minZ;
        const centerX = (autoBounds.minX + autoBounds.maxX) / 2;
        const centerZ = (autoBounds.minZ + autoBounds.maxZ) / 2;

        camera.position.set(centerX, 200, centerZ);
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.zoom = 1;
        camera.updateProjectionMatrix();

        if (controlsRef.current) {
          controlsRef.current.target.set(centerX, 0, centerZ);
          controlsRef.current.update();
        }
      }
    };

    (window as any).applyAutoBounds = applyAutoBounds;
    // Initial apply
    applyAutoBounds();

    return () => {
      delete (window as any).applyAutoBounds;
    };
  }, [camera, autoBounds]);

  // Track dynamic bounds without triggering React re-renders!
  useFrame(() => {
    if (camera instanceof THREE.OrthographicCamera && boundsTextRef.current) {
      const width = (camera.right - camera.left) / camera.zoom;
      const height = (camera.top - camera.bottom) / camera.zoom;
      const minX = Math.round(camera.position.x - width / 2);
      const maxX = Math.round(camera.position.x + width / 2);
      const minZ = Math.round(camera.position.z - height / 2);
      const maxZ = Math.round(camera.position.z + height / 2);

      // Direct DOM mutation for 60fps performance (prevents WebGL Context Lost!)
      boundsTextRef.current.innerText = JSON.stringify(
        { minX, maxX, minZ, maxZ },
        null,
        2,
      );
    }
  });

  // Attach screenshot capture logic
  useEffect(() => {
    (window as any).downloadMapScreenshot = () => {
      // Force an immediate render frame to ensure no UI overlays are missing
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "/assets/gps/map_background.png";
      a.click();
    };
    return () => {
      delete (window as any).downloadMapScreenshot;
    };
  }, [gl, camera, scene]);

  return (
    <MapControls ref={controlsRef} enableRotate={false} dampingFactor={0.05} />
  );
}

// ----------------------------------------------------------------------------
// 4. Main Page Route Component
// ----------------------------------------------------------------------------
export function BackgroundMapPage() {
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const boundsTextRef = useRef<HTMLPreElement>(null);

  // Load road network waypoints to compute perfect GPS bounds
  useEffect(() => {
    const saved = localStorage.getItem("la-fabrik-waypoints");
    if (saved) {
      setWaypoints(JSON.parse(saved));
    } else {
      fetch("/roadNetwork.json")
        .then((res) => res.json())
        .then((data) => setWaypoints(data))
        .catch(() => {});
    }
  }, []);

  // Compute exact bounds that the EbikeGPSMap will use by default
  const autoBounds = useMemo(() => {
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
          {showWaypoints ? "👁️ Masquer Waypoints" : "👁️‍🗨️ Afficher Waypoints"}
        </button>

        <button
          onClick={() => {
            if ((window as any).applyAutoBounds)
              (window as any).applyAutoBounds();
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
          🎯 Cadrage Automatique
        </button>

        <button
          onClick={() => {
            if ((window as any).downloadMapScreenshot)
              (window as any).downloadMapScreenshot();
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
          📸 Capturer la carte (.png)
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
