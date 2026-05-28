import type { ReactNode } from "react";
import { Component, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Line } from "@react-three/drei";
import { RepairGame } from "@/components/three/gameplay/RepairGame";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { AnimatedModel } from "@/components/three/models/AnimatedModel";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { EbikeGPSMap } from "@/components/ebike/EbikeGPSMap";
import {
  TEST_SCENE_FLOOR_COLLIDER_HALF_EXTENTS,
  TEST_SCENE_FLOOR_POSITION,
  TEST_SCENE_FLOOR_SIZE,
  TEST_SCENE_GRABBABLE_BOX_SIZE,
  TEST_SCENE_GRABBABLE_COLOR,
  TEST_SCENE_GRABBABLE_METALNESS,
  TEST_SCENE_GRABBABLE_POSITION,
  TEST_SCENE_GRABBABLE_ROUGHNESS,
  GAME_REPAIR_ZONES,
  TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS,
  TEST_SCENE_REPAIR_ZONE_MARKER_TUBE_RADIUS,
  TEST_SCENE_TRIGGER_COLOR,
  TEST_SCENE_TRIGGER_METALNESS,
  TEST_SCENE_TRIGGER_POSITION,
  TEST_SCENE_TRIGGER_RADIUS,
  TEST_SCENE_TRIGGER_ROUGHNESS,
  TEST_SCENE_TRIGGER_SEGMENTS,
  TEST_SCENE_TRIGGER_SOUND_PATH,
} from "@/data/debug/testSceneConfig";
import { useOctreeGraphNode } from "@/hooks/three/useOctreeGraphNode";
import type { OctreeReadyHandler } from "@/types/three/three";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

const ELECTRICIENNE_ANIMATED_MODEL_PATH =
  "/models/electricienne-animated/model.gltf";

interface TestMapProps {
  onOctreeReady: OctreeReadyHandler;
}

interface ModelPreviewErrorBoundaryProps {
  children: ReactNode;
  modelPath: string;
}

interface ModelPreviewErrorBoundaryState {
  hasError: boolean;
}

interface RepairPlaygroundZoneMarkerProps {
  color: string;
}

class ModelPreviewErrorBoundary extends Component<
  ModelPreviewErrorBoundaryProps,
  ModelPreviewErrorBoundaryState
> {
  constructor(props: ModelPreviewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModelPreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logModelLoadError(
      {
        modelPath: this.props.modelPath,
        scope: "TestMap.ModelPreview",
        position: [0, 0, -5],
        scale: 1,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

interface Waypoint {
  id: number;
  x: number;
  y: number;
  z: number;
  connections: number[];
}

export function TestMap({ onOctreeReady }: TestMapProps): React.JSX.Element {
  const floorRef = useRef<THREE.Group>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  useOctreeGraphNode(floorRef, onOctreeReady);

  // Load waypoints with double-safe fallback
  useEffect(() => {
    // 1. Try localStorage
    const saved = localStorage.getItem("la-fabrik-waypoints");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(
            `[TestMap] ${parsed.length} waypoints chargés depuis localStorage.`,
          );
          setWaypoints(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse local storage waypoints", e);
      }
    }

    // 2. Try public/roadNetwork.json
    console.log(
      "[TestMap] Tentative de chargement depuis /roadNetwork.json...",
    );
    fetch("/roadNetwork.json")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Impossible de charger /roadNetwork.json");
      })
      .then((data) => {
        if (Array.isArray(data)) {
          console.log(
            `[TestMap] ${data.length} waypoints chargés depuis /roadNetwork.json.`,
          );
          setWaypoints(data);
        }
      })
      .catch((err) => {
        console.log("[TestMap] Aucun point d'A* trouvé par défaut.", err);
      });
  }, []);

  return (
    <>
      <group ref={floorRef}>
        <mesh visible={false} position={TEST_SCENE_FLOOR_POSITION}>
          <boxGeometry args={TEST_SCENE_FLOOR_SIZE} />
          <meshBasicMaterial />
        </mesh>
      </group>

      {/* Render Pathfinder Maps Waypoints & Routes visually */}
      <group name="pathfinder-maps-visuals">
        {/* Render Connection Lines */}
        {waypoints.flatMap((wp) =>
          wp.connections.map((connId) => {
            const other = waypoints.find((w) => w.id === connId);
            // Draw each line only once by enforcing wp.id < other.id
            if (other && wp.id < other.id) {
              return (
                <Line
                  key={`route-${wp.id}-${other.id}`}
                  points={[
                    [wp.x, wp.y + 0.3, wp.z],
                    [other.x, other.y + 0.3, other.z],
                  ]}
                  color="#10b981" // Beautiful emerald green
                  lineWidth={2.5}
                  transparent
                  opacity={0.8}
                />
              );
            }
            return null;
          }),
        )}

        {/* Render Waypoint Spheres */}
        {waypoints.map((wp) => (
          <mesh key={`wp-sphere-${wp.id}`} position={[wp.x, wp.y + 0.3, wp.z]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshBasicMaterial
              color="#059669" // Deep emerald green
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      <Physics>
        <RigidBody type="fixed">
          <CuboidCollider
            args={TEST_SCENE_FLOOR_COLLIDER_HALF_EXTENTS}
            position={TEST_SCENE_FLOOR_POSITION}
          />
        </RigidBody>

        <GrabbableObject
          position={TEST_SCENE_GRABBABLE_POSITION}
          colliders="cuboid"
          handControlled
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={TEST_SCENE_GRABBABLE_BOX_SIZE} />
            <meshStandardMaterial
              color={TEST_SCENE_GRABBABLE_COLOR}
              roughness={TEST_SCENE_GRABBABLE_ROUGHNESS}
              metalness={TEST_SCENE_GRABBABLE_METALNESS}
            />
          </mesh>
        </GrabbableObject>

        <TriggerObject
          position={TEST_SCENE_TRIGGER_POSITION}
          soundPath={TEST_SCENE_TRIGGER_SOUND_PATH}
        >
          <mesh castShadow receiveShadow>
            <sphereGeometry
              args={[
                TEST_SCENE_TRIGGER_RADIUS,
                TEST_SCENE_TRIGGER_SEGMENTS,
                TEST_SCENE_TRIGGER_SEGMENTS,
              ]}
            />
            <meshStandardMaterial
              color={TEST_SCENE_TRIGGER_COLOR}
              roughness={TEST_SCENE_TRIGGER_ROUGHNESS}
              metalness={TEST_SCENE_TRIGGER_METALNESS}
            />
          </mesh>
        </TriggerObject>

        {GAME_REPAIR_ZONES.map((zone) => (
          <group key={zone.mission}>
            <group position={zone.position}>
              <RepairPlaygroundZoneMarker color={zone.color} />
            </group>
            <RepairGame mission={zone.mission} position={zone.position} />
          </group>
        ))}
      </Physics>

      {/* Dynamic Futuristic 3D GPS Dashboard Preview */}
      <group position={[0, 2.8, -4.8]} rotation={[0, 0, 0]}>
        {/* Futuristic glowing screen frame (commented out to show true 3D transparency!) */}
        {/*
        <mesh>
          <boxGeometry args={[4.2, 4.2, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} transparent opacity={0.4} />
        </mesh>
        */}
        {/* Glow accent border (commented out to remove any orange transparency tint!) */}
        {/*
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[4.05, 4.05, 0.02]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.1} />
        </mesh>
        */}
        {/* GPS Map screen plane */}
        <group position={[0, 0, 0.06]}>
          <EbikeGPSMap
            width={4}
            height={4}
            startPos={{ x: 10, y: 0, z: -10 }}
            destPos={{ x: -40, y: 0, z: 30 }}
            mapImageUrl="/assets/gps/map_background.png"
            worldBounds={{
              minX: -166,
              maxX: 163,
              minZ: -142,
              maxZ: 138,
            }}
            zoom={1}
            canvasSize={900}
          />
        </group>
      </group>

      <ModelPreviewErrorBoundary modelPath={ELECTRICIENNE_ANIMATED_MODEL_PATH}>
        <AnimatedModel
          modelPath={ELECTRICIENNE_ANIMATED_MODEL_PATH}
          defaultAnimation="Dance"
          position={[0, 0, -5]}
          scale={1}
        />
      </ModelPreviewErrorBoundary>
    </>
  );
}

function RepairPlaygroundZoneMarker({
  color,
}: RepairPlaygroundZoneMarkerProps): React.JSX.Element {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[
            TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS,
            TEST_SCENE_REPAIR_ZONE_MARKER_TUBE_RADIUS,
            12,
            96,
          ]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
