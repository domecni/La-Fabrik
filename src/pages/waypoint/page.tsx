import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  OrthographicCamera,
  MapControls,
  Line,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Trash2,
  Link2,
  Download,
  Clipboard,
  Info,
  MapPin,
  Map as MapIcon,
} from "lucide-react";

// ==========================================
// 1. Waypoint Interfaces
// ==========================================

export interface Waypoint {
  id: number;
  x: number;
  y: number; // height (Raycasted from terrain)
  z: number;
  connections: number[];
}

// ==========================================
// 2. Editor Scene Manager Component
// ==========================================

interface EditorSceneProps {
  waypoints: Waypoint[];
  selectedId: number | null;
  hoveredNodeId: number | null;
  setHoveredNodeId: (id: number | null) => void;
  setDragStartNodeId: (id: number | null) => void;
  dragStartNodeId: number | null;
  hoverPointRef: React.MutableRefObject<THREE.Vector3 | null>;
  handleTerrainClick: (point: THREE.Vector3) => void;
  handleSelectNode: (id: number) => void;
  selectedConnection: { idA: number; idB: number } | null;
  setSelectedConnection: (conn: { idA: number; idB: number } | null) => void;
  hoveredConnection: { idA: number; idB: number } | null;
  setHoveredConnection: (conn: { idA: number; idB: number } | null) => void;
}

const EditorScene: React.FC<EditorSceneProps> = ({
  waypoints,
  selectedId,
  hoveredNodeId,
  setHoveredNodeId,
  setDragStartNodeId,
  dragStartNodeId,
  hoverPointRef,
  handleTerrainClick,
  handleSelectNode,
  selectedConnection,
  setSelectedConnection,
  hoveredConnection,
  setHoveredConnection,
}) => {
  const { scene } = useGLTF("/models/terrain/terrain.glb");
  const { raycaster, pointer, camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const rubberLineRef = useRef<THREE.Line>(null);
  const rubberLineInstance = React.useMemo(() => new THREE.Line(), []);

  // Mirror reactive props inside Refs to guarantee useFrame loop never closes over stale state
  const hoveredNodeIdRef = useRef<number | null>(null);
  const dragStartNodeIdRef = useRef<number | null>(null);
  const waypointsRef = useRef<Waypoint[]>([]);

  useEffect(() => {
    hoveredNodeIdRef.current = hoveredNodeId;
  }, [hoveredNodeId]);

  useEffect(() => {
    dragStartNodeIdRef.current = dragStartNodeId;
  }, [dragStartNodeId]);

  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  // Continuously raycast from mouse position to terrain and waypoints to detect hovers during drag
  useFrame(() => {
    if (!groupRef.current) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(
      groupRef.current.children,
      true,
    );

    // Find waypoint sphere hover (only trigger React state update if hovered ID changes)
    const sphereIntersect = intersects.find(
      (item) => item.object.name && item.object.name.startsWith("waypoint-"),
    );
    if (sphereIntersect) {
      const nodeId = Number(
        sphereIntersect.object.name.replace("waypoint-", ""),
      );
      if (hoveredNodeIdRef.current !== nodeId) {
        setHoveredNodeId(nodeId);
      }
    } else {
      if (hoveredNodeIdRef.current !== null) {
        setHoveredNodeId(null);
      }
    }

    // Find terrain mesh hover
    const terrainIntersect = intersects.find(
      (item) => item.object.name && !item.object.name.startsWith("waypoint-"),
    );
    const activeTerrainIntersect =
      terrainIntersect || intersects.find((item) => !item.object.name);

    if (activeTerrainIntersect && activeTerrainIntersect.point) {
      const point = activeTerrainIntersect.point;
      hoverPointRef.current = point.clone();

      // 1. Bypass React state: Update HTML Floating Panel directly for 0ms lag
      const coordsPanel = document.getElementById("coords-panel");
      if (coordsPanel) {
        coordsPanel.innerText = `X: ${point.x.toFixed(2)} | Y (Raycast): ${point.y.toFixed(2)} | Z: ${point.z.toFixed(2)}`;
      }

      // 2. Bypass React state: Update pink rubber band line dynamically in WebGL
      const activeDragId = dragStartNodeIdRef.current;
      if (activeDragId !== null && rubberLineRef.current) {
        rubberLineRef.current.visible = true;
        const startNode = waypointsRef.current.find(
          (w) => w.id === activeDragId,
        );
        if (startNode) {
          rubberLineRef.current.geometry.setFromPoints([
            new THREE.Vector3(startNode.x, startNode.y + 0.4, startNode.z),
            new THREE.Vector3(point.x, point.y + 0.4, point.z),
          ]);
        }
      } else if (rubberLineRef.current) {
        rubberLineRef.current.visible = false;
      }
    } else {
      if (rubberLineRef.current) {
        rubberLineRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Terrain Mesh (Raycasted for adding/dragging) */}
      <primitive
        object={scene}
        onClick={(e: any) => {
          e.stopPropagation();
          // Only click-to-create a new node if they are not actively dragging a link
          if (dragStartNodeId === null && e.point) {
            handleTerrainClick(e.point);
          }
        }}
      />

      {/* 2. Drag Rubber Band Preview Line (WebGL optimized) */}
      <primitive
        object={rubberLineInstance}
        ref={rubberLineRef}
        visible={false}
      >
        <bufferGeometry attach="geometry" />
        <lineBasicMaterial
          attach="material"
          color="#ff0055" // Neon pink
          linewidth={3}
          depthTest={false}
          transparent
          opacity={0.9}
        />
      </primitive>

      {/* 3. Render Established Connections */}
      <ConnectionLines
        waypoints={waypoints}
        selectedConnection={selectedConnection}
        setSelectedConnection={setSelectedConnection}
        hoveredConnection={hoveredConnection}
        setHoveredConnection={setHoveredConnection}
      />

      {/* 4. Render Waypoint Node Spheres */}
      <WaypointMarkers
        waypoints={waypoints}
        selectedId={selectedId}
        onSelect={handleSelectNode}
        hoveredNodeId={hoveredNodeId}
        setHoveredNodeId={setHoveredNodeId}
        setDragStartNodeId={setDragStartNodeId}
      />
    </group>
  );
};

// ==========================================
// 3. Grid Visualizer & Helpers
// ==========================================

interface WaypointMarkersProps {
  waypoints: Waypoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  hoveredNodeId: number | null;
  setHoveredNodeId: (id: number | null) => void;
  setDragStartNodeId: (id: number | null) => void;
}

const WaypointMarkers: React.FC<WaypointMarkersProps> = ({
  waypoints,
  selectedId,
  onSelect,
  hoveredNodeId,
  setHoveredNodeId,
  setDragStartNodeId,
}) => {
  return (
    <group>
      {waypoints.map((wp) => {
        const isSelected = wp.id === selectedId;
        const isHovered = wp.id === hoveredNodeId;

        let color = "#3b82f6"; // Standard blue
        let scale = 1.0;

        if (isSelected) {
          color = "#ff0055"; // Pink-red for selected
          scale = 1.5;
        } else if (isHovered) {
          color = "#60a5fa"; // Bright blue for hovered
          scale = 1.25;
        }

        return (
          <group
            key={wp.id}
            position={[wp.x, wp.y + 0.5, wp.z]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredNodeId(wp.id);
            }}
            onPointerOut={() => {
              setHoveredNodeId(null);
            }}
            onPointerDown={(e: any) => {
              e.stopPropagation();
              if (e.button === 0) {
                // Left click start drag link connection
                setDragStartNodeId(wp.id);
              } else if (e.button === 2) {
                // Right click select waypoint
                onSelect(wp.id);
              }
            }}
          >
            {/* Core Marker Node */}
            <mesh name={`waypoint-${wp.id}`}>
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshBasicMaterial color={color} depthTest={false} />
            </mesh>

            {/* Ring indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.2 * scale, 1.4 * scale, 32]} />
              <meshBasicMaterial
                color={color}
                side={THREE.DoubleSide}
                depthTest={false}
                transparent
                opacity={0.7}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

interface ConnectionLinesProps {
  waypoints: Waypoint[];
  selectedConnection: { idA: number; idB: number } | null;
  setSelectedConnection: (conn: { idA: number; idB: number } | null) => void;
  hoveredConnection: { idA: number; idB: number } | null;
  setHoveredConnection: (conn: { idA: number; idB: number } | null) => void;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  waypoints,
  selectedConnection,
  setSelectedConnection,
  hoveredConnection,
  setHoveredConnection,
}) => {
  // Generate pairs of lines
  const lines = React.useMemo(() => {
    const list: [THREE.Vector3, THREE.Vector3, number, number][] = [];
    const drawn = new Set<string>();

    waypoints.forEach((wp) => {
      wp.connections.forEach((connId) => {
        const other = waypoints.find((w) => w.id === connId);
        if (other) {
          const key =
            wp.id < other.id ? `${wp.id}-${other.id}` : `${other.id}-${wp.id}`;
          if (!drawn.has(key)) {
            drawn.add(key);
            list.push([
              new THREE.Vector3(wp.x, wp.y + 0.4, wp.z),
              new THREE.Vector3(other.x, other.y + 0.4, other.z),
              wp.id,
              other.id,
            ]);
          }
        }
      });
    });
    return list;
  }, [waypoints]);

  return (
    <group>
      {lines.map(([start, end, idA, idB]) => {
        const isSelected =
          selectedConnection &&
          ((selectedConnection.idA === idA && selectedConnection.idB === idB) ||
            (selectedConnection.idA === idB && selectedConnection.idB === idA));
        const isHovered =
          hoveredConnection &&
          ((hoveredConnection.idA === idA && hoveredConnection.idB === idB) ||
            (hoveredConnection.idA === idB && hoveredConnection.idB === idA));

        let color = "#10b981"; // Emerald green
        let lineWidth = 3;

        if (isSelected) {
          color = "#f59e0b"; // Amber yellow for selected connection
          lineWidth = 5.0;
        } else if (isHovered) {
          color = "#60a5fa"; // Bright blue for hovered connection
          lineWidth = 4.5;
        }

        return (
          <Line
            key={`${idA}-${idB}`}
            points={[start, end]}
            color={color}
            lineWidth={lineWidth}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredConnection({ idA, idB });
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredConnection(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log(
                `[Lien 3D] Sélectionné: Point ${idA} <-> Point ${idB}`,
              );
              setSelectedConnection({ idA, idB });
            }}
          />
        );
      })}
    </group>
  );
};

// ==========================================
// 4. Main Waypoint Editor Page Component
// ==========================================

export const WaypointEditorPage: React.FC = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  // Selection / Hover states for 3D paths/connections
  const [selectedConnection, setSelectedConnection] = useState<{
    idA: number;
    idB: number;
  } | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{
    idA: number;
    idB: number;
  } | null>(null);

  // Helper function to handle connection selection and reset node selection
  const handleSelectConnection = (
    conn: { idA: number; idB: number } | null,
  ) => {
    if (conn) {
      console.log(
        `[Sélection] Liaison active sélectionnée : Point ${conn.idA} <-> Point ${conn.idB}`,
      );
      setSelectedId(null); // Clear selected node
    }
    setSelectedConnection(conn);
  };

  // Mutable ref for high frequency raycast updates to bypass React rendering loop
  const hoverPointRef = useRef<THREE.Vector3 | null>(null);

  // Connection / Drag states
  const [dragStartNodeId, setDragStartNodeId] = useState<number | null>(null);
  const [isConnectingMode, setIsConnectingMode] = useState<boolean>(false);
  const [activeConnectionStartId, setActiveConnectionStartId] = useState<
    number | null
  >(null);

  // Load from localstorage on mount
  useEffect(() => {
    console.log(
      "[Initialisation] Chargement des waypoints depuis localStorage...",
    );
    const saved = localStorage.getItem("la-fabrik-waypoints");
    if (saved) {
      try {
        const list = JSON.parse(saved);
        console.log(
          `[Initialisation] ${list.length} waypoints chargés avec succès !`,
        );
        setWaypoints(list);
      } catch (e) {
        console.error(
          "[Initialisation] Erreur de parsing du stockage local",
          e,
        );
      }
    } else {
      console.log(
        "[Initialisation] Aucun point enregistré en localStorage. Démarrage à vide.",
      );
    }
  }, []);

  // Save to localstorage when waypoints change
  const saveWaypoints = (list: Waypoint[]) => {
    setWaypoints(list);
    localStorage.setItem("la-fabrik-waypoints", JSON.stringify(list));
  };

  // Delete a specific connection (break the link)
  const deleteSelectedConnection = (idA: number, idB: number) => {
    console.log(
      `[Liaisons] Suppression définitive du lien : Point ${idA} <-> Point ${idB}`,
    );
    setWaypoints((currentWaypoints) => {
      const updatedList = currentWaypoints.map((wp) => {
        if (wp.id === idA) {
          return {
            ...wp,
            connections: wp.connections.filter((cId) => cId !== idB),
          };
        }
        if (wp.id === idB) {
          return {
            ...wp,
            connections: wp.connections.filter((cId) => cId !== idA),
          };
        }
        return wp;
      });
      localStorage.setItem("la-fabrik-waypoints", JSON.stringify(updatedList));
      return updatedList;
    });
    setSelectedConnection(null);
  };

  // Listen for global keyboard shortcuts (e.g. Delete node or connection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        console.log(`[Hotkey] Touche '${e.key}' détectée.`);
        if (selectedId !== null) {
          console.log(
            `[Hotkey] Touche de suppression activée sur le Point sélectionné : ID = ${selectedId}`,
          );
          handleDeleteNode(selectedId);
        } else if (selectedConnection !== null) {
          console.log(
            `[Hotkey] Touche de suppression activée sur la Liaison sélectionnée : ${selectedConnection.idA} <-> ${selectedConnection.idB}`,
          );
          deleteSelectedConnection(
            selectedConnection.idA,
            selectedConnection.idB,
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, selectedConnection, waypoints]);

  // Add a new waypoint
  const handleTerrainClick = (point: THREE.Vector3) => {
    if (isConnectingMode) {
      console.log(
        "[Mode Connexion] Clic sur terrain vide. Annulation du mode liaison.",
      );
      setIsConnectingMode(false);
      setActiveConnectionStartId(null);
      return;
    }

    setWaypoints((currentWaypoints) => {
      const nextId =
        currentWaypoints.length > 0
          ? Math.max(...currentWaypoints.map((w) => w.id)) + 1
          : 1;
      const newWp: Waypoint = {
        id: nextId,
        x: Number(point.x.toFixed(2)),
        y: Number(point.y.toFixed(2)),
        z: Number(point.z.toFixed(2)),
        connections: [],
      };

      console.log(
        `[Création] Nouveau Point déposé : ID = ${nextId} | Coordonnées : (${newWp.x}, ${newWp.y}, ${newWp.z})`,
      );
      const newList = [...currentWaypoints, newWp];
      localStorage.setItem("la-fabrik-waypoints", JSON.stringify(newList));
      setTimeout(() => {
        setSelectedConnection(null);
        setSelectedId(nextId);
      }, 0);
      return newList;
    });
  };

  // Select node or handle connections (toggles connections if they already exist)
  const handleSelectNode = (id: number) => {
    setSelectedConnection(null); // Reset connection selection

    if (isConnectingMode && activeConnectionStartId !== null) {
      if (activeConnectionStartId === id) {
        console.log(
          "[Mode Connexion] Tentative de liaison sur soi-même. Annulation.",
        );
        setIsConnectingMode(false);
        setActiveConnectionStartId(null);
        return;
      }

      console.log(
        `[Mode Connexion] Création manuelle d'un lien : Point ${activeConnectionStartId} <-> Point ${id}`,
      );
      toggleConnection(activeConnectionStartId, id);
      setIsConnectingMode(false);
      setActiveConnectionStartId(null);
      setSelectedId(id);
    } else {
      console.log(`[Sélection] Point sélectionné : ID = ${id}`);
      setSelectedId(id);
    }
  };

  // Toggle connection between two waypoint IDs (using functional state to prevent stale closures)
  const toggleConnection = (idA: number, idB: number) => {
    console.log(`[Liaisons] toggleConnection(Point ${idA}, Point ${idB})`);
    setWaypoints((currentWaypoints) => {
      const updatedList = currentWaypoints.map((wp) => {
        if (wp.id === idA) {
          const alreadyLinked = wp.connections.includes(idB);
          console.log(
            `[Liaisons] Point ${idA} : ${alreadyLinked ? "Suppression" : "Ajout"} de la liaison vers Point ${idB}`,
          );
          const conns = alreadyLinked
            ? wp.connections.filter((cId) => cId !== idB)
            : [...wp.connections, idB];
          return { ...wp, connections: conns };
        }
        if (wp.id === idB) {
          const alreadyLinked = wp.connections.includes(idA);
          console.log(
            `[Liaisons] Point ${idB} : ${alreadyLinked ? "Suppression" : "Ajout"} de la liaison vers Point ${idA}`,
          );
          const conns = alreadyLinked
            ? wp.connections.filter((cId) => cId !== idA)
            : [...wp.connections, idA];
          return { ...wp, connections: conns };
        }
        return wp;
      });
      localStorage.setItem("la-fabrik-waypoints", JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Global pointer up handler for completing link drags (releases on empty space create & connect a node)
  const handleGlobalPointerUp = () => {
    if (dragStartNodeId !== null) {
      if (hoveredNodeId !== null && hoveredNodeId !== dragStartNodeId) {
        console.log(
          `[Drag&Drop] Relâchement sur le Point existant : ID = ${hoveredNodeId}. Création/Toggling du lien.`,
        );
        toggleConnection(dragStartNodeId, hoveredNodeId);
      } else if (hoverPointRef.current !== null) {
        const point = hoverPointRef.current;
        setWaypoints((currentWaypoints) => {
          const nextId =
            currentWaypoints.length > 0
              ? Math.max(...currentWaypoints.map((w) => w.id)) + 1
              : 1;
          const newWp: Waypoint = {
            id: nextId,
            x: Number(point.x.toFixed(2)),
            y: Number(point.y.toFixed(2)),
            z: Number(point.z.toFixed(2)),
            connections: [dragStartNodeId],
          };

          console.log(
            `[Drag&Drop] Relâchement sur zone vide. Création automatique du Point ${nextId} aux coordonnées (${newWp.x}, ${newWp.y}, ${newWp.z}) et liaison mutuelle avec le Point ${dragStartNodeId}`,
          );

          const updatedList = currentWaypoints.map((wp) => {
            if (wp.id === dragStartNodeId) {
              return {
                ...wp,
                connections: wp.connections.includes(nextId)
                  ? wp.connections
                  : [...wp.connections, nextId],
              };
            }
            return wp;
          });

          const finalList = [...updatedList, newWp];
          localStorage.setItem(
            "la-fabrik-waypoints",
            JSON.stringify(finalList),
          );
          setTimeout(() => {
            setSelectedConnection(null);
            setSelectedId(nextId);
          }, 0);
          return finalList;
        });
      } else {
        setSelectedId(dragStartNodeId);
      }
      setDragStartNodeId(null);
    }
  };

  // Delete current selected node
  const handleDeleteNode = (id: number) => {
    console.log(
      `[Suppression] Action de suppression définitive du Point : ID = ${id}`,
    );
    setWaypoints((currentWaypoints) => {
      const updatedList = currentWaypoints
        .filter((wp) => wp.id !== id)
        .map((wp) => ({
          ...wp,
          connections: wp.connections.filter((cId) => cId !== id),
        }));
      console.log(
        `[Suppression] Point ${id} supprimé. ${updatedList.length} points restants.`,
      );
      localStorage.setItem("la-fabrik-waypoints", JSON.stringify(updatedList));
      return updatedList;
    });
    setSelectedId((currentSelected) =>
      currentSelected === id ? null : currentSelected,
    );
  };

  // Connect Mode Trigger
  const startConnecting = (id: number) => {
    console.log(
      `[Mode Connexion] Démarrage mode connexion manuelle depuis Point ID = ${id}`,
    );
    setIsConnectingMode(true);
    setActiveConnectionStartId(id);
  };

  // Clear all waypoints
  const handleClearAll = () => {
    if (
      window.confirm(
        "Voulez-vous vraiment TOUT supprimer ? Cette action est irréversible.",
      )
    ) {
      console.log(
        "[Action] Suppression complète et définitive de tous les points de la carte.",
      );
      saveWaypoints([]);
      setSelectedId(null);
      setSelectedConnection(null);
    }
  };

  // Copy network JSON to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(waypoints, null, 2));
    alert("JSON copié dans le presse-papier !");
  };

  // Download network JSON file
  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(waypoints, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "roadNetwork.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const selectedNode = waypoints.find((w) => w.id === selectedId);

  return (
    <div style={styles.container}>
      {/* 1. Header Navigation */}
      <header style={styles.header}>
        <div style={styles.logoGroup}>
          <MapIcon size={24} style={styles.logoIcon} />
          <h1 style={styles.logoText}>La Fabrik — Waypoint Network Editor</h1>
        </div>
        <div style={styles.headerControls}>
          <button
            style={styles.secondaryButton}
            onClick={handleCopyToClipboard}
          >
            <Clipboard size={16} /> Copier JSON
          </button>
          <button style={styles.primaryButton} onClick={handleDownload}>
            <Download size={16} /> Télécharger roadNetwork.json
          </button>
        </div>
      </header>

      <div style={styles.mainArea}>
        {/* 2. Left sidebar: Nodes manager */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Liste des Waypoints</h2>
            {waypoints.length > 0 && (
              <button style={styles.clearButton} onClick={handleClearAll}>
                <Trash2 size={14} /> Tout effacer
              </button>
            )}
          </div>

          <div style={styles.nodesList}>
            {waypoints.length === 0 ? (
              <div style={styles.emptyState}>
                <MapPin size={32} style={styles.emptyIcon} />
                <p style={styles.emptyText}>
                  Cliquez sur le terrain pour placer votre premier point.
                </p>
              </div>
            ) : (
              waypoints.map((wp) => (
                <div
                  key={wp.id}
                  style={styles.nodeItem(wp.id === selectedId)}
                  onClick={() => handleSelectNode(wp.id)}
                  onMouseEnter={() => setHoveredNodeId(wp.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  <div style={styles.nodeInfo}>
                    <span style={styles.nodeBadge}>ID: {wp.id}</span>
                    <span style={styles.nodeCoords}>
                      ({wp.x}, {wp.y}, {wp.z})
                    </span>
                  </div>
                  <div style={styles.nodeSubinfo}>
                    Connexions : {wp.connections.join(", ") || "Aucune"}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details & editing for selected node */}
          {selectedNode && (
            <div style={styles.detailsCard}>
              <h3 style={styles.detailsTitle}>
                Détails Waypoint {selectedNode.id}
              </h3>
              <div style={styles.detailsGrid}>
                <div style={styles.detailsRow}>
                  <strong>Pos X:</strong> <span>{selectedNode.x}</span>
                </div>
                <div style={styles.detailsRow}>
                  <strong>Pos Y:</strong>{" "}
                  <span>{selectedNode.y} (Hauteur)</span>
                </div>
                <div style={styles.detailsRow}>
                  <strong>Pos Z:</strong> <span>{selectedNode.z}</span>
                </div>
              </div>

              <div style={styles.detailsActions}>
                <button
                  style={styles.connectButton(
                    isConnectingMode &&
                      activeConnectionStartId === selectedNode.id,
                  )}
                  onClick={() => startConnecting(selectedNode.id)}
                >
                  <Link2 size={16} />
                  {isConnectingMode &&
                  activeConnectionStartId === selectedNode.id
                    ? "Cliquez sur un autre..."
                    : "Relier à..."}
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </div>
          )}

          {/* Details & editing for selected connection path */}
          {selectedConnection && (
            <div style={styles.detailsCard}>
              <h3 style={styles.detailsTitle}>Liaison Sélectionnée</h3>
              <div style={{ ...styles.detailsGrid, marginBottom: "1.25rem" }}>
                <div style={styles.detailsRow}>
                  <strong>Point A:</strong>{" "}
                  <span>ID {selectedConnection.idA}</span>
                </div>
                <div style={styles.detailsRow}>
                  <strong>Point B:</strong>{" "}
                  <span>ID {selectedConnection.idB}</span>
                </div>
                <div style={styles.detailsRow}>
                  <strong>Type:</strong> <span>Lien Bidirectionnel</span>
                </div>
              </div>
              <button
                style={styles.deleteButton}
                onClick={() =>
                  deleteSelectedConnection(
                    selectedConnection.idA,
                    selectedConnection.idB,
                  )
                }
              >
                <Trash2 size={16} /> Supprimer la Liaison
              </button>
            </div>
          )}
        </aside>

        {/* 3. Three.js Canvas */}
        <main
          style={styles.canvasContainer}
          onPointerUp={handleGlobalPointerUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Active Hover point details (DOM-optimized to prevent high-frequency React renders) */}
          <div id="coords-panel" style={styles.coordsFloating}>
            Survolez le terrain...
          </div>

          {isConnectingMode && (
            <div style={styles.connectingBanner}>
              <Info size={16} /> Mode Connexion Actif : Cliquez sur le deuxième
              waypoint pour lier le point {activeConnectionStartId}.
            </div>
          )}

          {dragStartNodeId !== null && (
            <div style={styles.connectingBanner}>
              <Link2 size={16} /> Relier le point {dragStartNodeId}... Glissez
              et relâchez sur un autre point.
            </div>
          )}

          <Canvas shadows>
            {/* Top-down isometric / orthographic camera */}
            <OrthographicCamera
              makeDefault
              position={[0, 150, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              zoom={8}
              far={1000}
              near={0.1}
            />

            <ambientLight intensity={1.5} />
            <directionalLight
              position={[50, 200, 50]}
              intensity={2.0}
              castShadow
            />

            {/* Locked Orbit/Map controls (Locked rotation for strict top-down, disabled during link dragging to prevent panning) */}
            <MapControls
              enableRotate={false}
              enabled={dragStartNodeId === null}
            />

            {/* Load Terrain, Track hover & draw drag previews/spheres cleanly using full-rate raycasting scene */}
            <EditorScene
              waypoints={waypoints}
              selectedId={selectedId}
              hoveredNodeId={hoveredNodeId}
              setHoveredNodeId={setHoveredNodeId}
              setDragStartNodeId={setDragStartNodeId}
              dragStartNodeId={dragStartNodeId}
              hoverPointRef={hoverPointRef}
              handleTerrainClick={handleTerrainClick}
              handleSelectNode={handleSelectNode}
              selectedConnection={selectedConnection}
              setSelectedConnection={handleSelectConnection}
              hoveredConnection={hoveredConnection}
              setHoveredConnection={setHoveredConnection}
            />
          </Canvas>
        </main>
      </div>
    </div>
  );
};

// ==========================================
// Styles (Premium Dark Glassmorphism)
// ==========================================

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a", // deep slate
    color: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  } as React.CSSProperties,
  header: {
    height: "64px",
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    backdropFilter: "blur(12px)",
    zIndex: 10,
  } as React.CSSProperties,
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  } as React.CSSProperties,
  logoIcon: {
    color: "#3b82f6",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    margin: 0,
  } as React.CSSProperties,
  headerControls: {
    display: "flex",
    gap: "12px",
  } as React.CSSProperties,
  primaryButton: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s",
  } as React.CSSProperties,
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#f8fafc",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  } as React.CSSProperties,
  mainArea: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    position: "relative",
  } as React.CSSProperties,
  sidebar: {
    width: "360px",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    backdropFilter: "blur(16px)",
    zIndex: 5,
  } as React.CSSProperties,
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  } as React.CSSProperties,
  sidebarTitle: {
    fontSize: "16px",
    fontWeight: 600,
    margin: 0,
  } as React.CSSProperties,
  clearButton: {
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  } as React.CSSProperties,
  nodesList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingRight: "4px",
    marginBottom: "20px",
  } as React.CSSProperties,
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    color: "#64748b",
    textAlign: "center",
    padding: "0 20px",
  } as React.CSSProperties,
  emptyIcon: {
    marginBottom: "12px",
    color: "#475569",
  },
  emptyText: {
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
  } as React.CSSProperties,
  nodeItem: (isSelected: boolean): React.CSSProperties => ({
    padding: "12px",
    borderRadius: "10px",
    border: `1px solid ${isSelected ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.05)"}`,
    backgroundColor: isSelected
      ? "rgba(59, 130, 246, 0.12)"
      : "rgba(255, 255, 255, 0.02)",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  }),
  nodeInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,
  nodeBadge: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#3b82f6",
  } as React.CSSProperties,
  nodeCoords: {
    fontSize: "11px",
    color: "#94a3b8",
  } as React.CSSProperties,
  nodeSubinfo: {
    fontSize: "11px",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,
  detailsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  } as React.CSSProperties,
  detailsTitle: {
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
  } as React.CSSProperties,
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
  } as React.CSSProperties,
  detailsRow: {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    paddingBottom: "4px",
  } as React.CSSProperties,
  detailsActions: {
    display: "flex",
    gap: "10px",
    marginTop: "6px",
  } as React.CSSProperties,
  connectButton: (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    backgroundColor: isActive ? "#ff0055" : "rgba(16, 185, 129, 0.15)",
    color: isActive ? "#ffffff" : "#10b981",
    border: `1px solid ${isActive ? "#ff0055" : "rgba(16, 185, 129, 0.3)"}`,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    boxShadow: isActive ? "0 4px 12px rgba(255, 0, 85, 0.3)" : "none",
    transition: "all 0.2s",
  }),
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.2s",
  } as React.CSSProperties,
  canvasContainer: {
    flex: 1,
    position: "relative",
  } as React.CSSProperties,
  coordsFloating: {
    position: "absolute",
    top: "16px",
    left: "16px",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "12px",
    color: "#94a3b8",
    backdropFilter: "blur(8px)",
    pointerEvents: "none",
    zIndex: 1,
  } as React.CSSProperties,
  connectingBanner: {
    position: "absolute",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#ff0055",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 500,
    boxShadow: "0 4px 20px rgba(255, 0, 85, 0.4)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    pointerEvents: "none",
    zIndex: 1,
  } as React.CSSProperties,
};
