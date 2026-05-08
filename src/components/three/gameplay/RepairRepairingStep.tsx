import { useState } from "react";
import * as THREE from "three";
import type { RepairCasePlaceholder } from "@/components/three/gameplay/RepairCaseModel";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import type { RepairScannedBrokenPart } from "@/components/three/gameplay/RepairScanSequence";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import {
  REPAIR_CASE_FOCUS_POSITION,
  REPAIR_CASE_PLACEHOLDER_SNAP_DURATION,
  REPAIR_CASE_PLACEHOLDER_SNAP_RADIUS,
} from "@/data/gameplay/repairCaseConfig";
import type {
  RepairMissionConfig,
  RepairMissionPartConfig,
} from "@/data/gameplay/repairMissions";
import type { Vector3Tuple } from "@/types/three/three";

const INSTALL_TARGET_POSITION: Vector3Tuple = [0, 0.8, 0];
const _placeholderPosition = new THREE.Vector3();
const REPLACEMENT_START_OFFSETS: Vector3Tuple[] = [
  [-1.15, 1, 0.25],
  [0, 1.05, 0.45],
  [1.15, 1, 0.25],
];
const BROKEN_PART_START_OFFSETS: Vector3Tuple[] = [
  [-1.35, 0.55, -0.85],
  [0, 0.6, -1],
  [1.35, 0.55, -0.85],
];
const REPAIR_INSTALL_RADIUS = 1.1;

interface RepairRepairingStepProps {
  brokenParts: readonly RepairScannedBrokenPart[];
  config: RepairMissionConfig;
  placeholders: readonly RepairCasePlaceholder[];
  onRepair: () => void;
}

export function RepairRepairingStep({
  brokenParts,
  config,
  placeholders,
  onRepair,
}: RepairRepairingStepProps): React.JSX.Element {
  const [placedPartIds, setPlacedPartIds] = useState<Record<string, boolean>>(
    {},
  );
  const [depositedBrokenPartIds, setDepositedBrokenPartIds] = useState<
    Record<string, boolean>
  >({});
  const replacementParts = getReplacementParts(config);
  const brokenPartsToDeposit = getBrokenPartsToDeposit(config, brokenParts);
  const requiredReplacementPart = replacementParts.find(
    (part) => part.id === config.requiredReplacementPartId,
  );
  const requiredReplacementLabel =
    requiredReplacementPart?.label ?? config.label;
  const placeholderTargets = getPlaceholderTargets(placeholders);
  const placeholderPositions = placeholderTargets.map(
    (target) => target.position,
  );
  const hasCorrectPartPlaced = Boolean(
    placedPartIds[config.requiredReplacementPartId],
  );
  const hasDepositedBrokenParts = brokenPartsToDeposit.every(
    (part) => depositedBrokenPartIds[part.id],
  );
  const hasWrongPartPlaced = replacementParts.some(
    (part) =>
      part.id !== config.requiredReplacementPartId && placedPartIds[part.id],
  );
  const isReadyToInstall = hasCorrectPartPlaced && hasDepositedBrokenParts;
  const installColor = isReadyToInstall
    ? "#22c55e"
    : hasWrongPartPlaced
      ? "#ef4444"
      : "#f97316";
  const installFillColor = isReadyToInstall
    ? "#86efac"
    : hasWrongPartPlaced
      ? "#fecaca"
      : "#fed7aa";

  function handleReplacementPosition(
    partId: string,
    position: THREE.Vector3,
  ): void {
    const isPlaced = isNearPlaceholder(position, placeholderPositions);
    setPlacedPartIds((current) => {
      if (!current[partId] || isPlaced) return current;

      return { ...current, [partId]: false };
    });
  }

  function handleReplacementSnap(partId: string): void {
    setPlacedPartIds((current) => {
      if (current[partId]) return current;

      return { ...current, [partId]: true };
    });
  }

  function handleBrokenPartPosition(
    partId: string,
    position: THREE.Vector3,
    targets: readonly Vector3Tuple[],
  ): void {
    const isDeposited = isNearPlaceholder(position, targets);
    setDepositedBrokenPartIds((current) => {
      if (!current[partId] || isDeposited) return current;

      return { ...current, [partId]: false };
    });
  }

  function handleBrokenPartSnap(partId: string): void {
    setDepositedBrokenPartIds((current) => {
      if (current[partId]) return current;

      return { ...current, [partId]: true };
    });
  }

  return (
    <group>
      <TriggerObject
        position={INSTALL_TARGET_POSITION}
        colliders="ball"
        label={
          isReadyToInstall
            ? `Installer ${requiredReplacementLabel}`
            : hasWrongPartPlaced
              ? `Mauvaise piece`
              : hasCorrectPartPlaced
                ? `Ranger piece cassee`
                : `Approcher ${requiredReplacementLabel}`
        }
        onTrigger={() => {
          if (!isReadyToInstall) return;

          onRepair();
        }}
      >
        <mesh>
          <torusGeometry args={[0.95, 0.045, 12, 96]} />
          <meshBasicMaterial color={installColor} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.9, 96]} />
          <meshBasicMaterial
            color={installFillColor}
            transparent
            opacity={0.35}
          />
        </mesh>
      </TriggerObject>

      {placeholderPositions.map((position, index) => (
        <mesh
          key={`${position.join(":")}-${index}`}
          position={position}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.26, 0.018, 8, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
        </mesh>
      ))}

      {replacementParts.map((part, index) => {
        const placeholderPosition =
          placeholderPositions[index % placeholderPositions.length] ??
          placeholderPositions[0]!;

        return (
          <GrabbableObject
            key={part.id}
            position={placeholderPosition}
            colliders="ball"
            handControlled
            label={`Prendre ${part.label}`}
            onPositionChange={(position) => {
              handleReplacementPosition(part.id, position);
            }}
            onSnap={() => {
              handleReplacementSnap(part.id);
            }}
            snapDuration={REPAIR_CASE_PLACEHOLDER_SNAP_DURATION}
            snapRadius={REPAIR_CASE_PLACEHOLDER_SNAP_RADIUS}
            snapTargets={placeholderPositions}
          >
            <RepairObjectModel
              label={part.label}
              modelPath={part.modelPath ?? config.modelPath}
              scale={0.36}
            />
          </GrabbableObject>
        );
      })}

      {brokenPartsToDeposit.map((part, index) => {
        const startOffset =
          BROKEN_PART_START_OFFSETS[index % BROKEN_PART_START_OFFSETS.length] ??
          BROKEN_PART_START_OFFSETS[0]!;
        const startPosition: Vector3Tuple = [
          REPAIR_CASE_FOCUS_POSITION[0] + startOffset[0],
          REPAIR_CASE_FOCUS_POSITION[1] + startOffset[1],
          REPAIR_CASE_FOCUS_POSITION[2] + startOffset[2],
        ];
        const targetPositions = getBrokenPartTargetPositions(
          part,
          placeholderTargets,
        );

        return (
          <GrabbableObject
            key={part.id}
            position={startPosition}
            colliders="ball"
            handControlled
            label={`Ranger ${part.label}`}
            onPositionChange={(position) => {
              handleBrokenPartPosition(part.id, position, targetPositions);
            }}
            onSnap={() => {
              handleBrokenPartSnap(part.id);
            }}
            snapDuration={REPAIR_CASE_PLACEHOLDER_SNAP_DURATION}
            snapRadius={REPAIR_CASE_PLACEHOLDER_SNAP_RADIUS}
            snapTargets={targetPositions}
          >
            <group>
              <RepairObjectModel
                label={part.label}
                modelPath={part.modelPath}
                scale={0.24}
              />
              <mesh position={[0, 0.42, 0]}>
                <sphereGeometry args={[0.11, 16, 16]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
              </mesh>
            </group>
          </GrabbableObject>
        );
      })}

      <RepairPromptVideo src={config.interactUiPath} position={[0, 2.3, 0]} />
    </group>
  );
}

function getPlaceholderTargets(
  placeholders: readonly RepairCasePlaceholder[],
): readonly RepairCasePlaceholder[] {
  if (placeholders.length > 0) {
    return placeholders;
  }

  return REPLACEMENT_START_OFFSETS.map(
    (offset, index): RepairCasePlaceholder => ({
      name: `fallback_${index + 1}`,
      position: [
        REPAIR_CASE_FOCUS_POSITION[0] + offset[0],
        REPAIR_CASE_FOCUS_POSITION[1] + offset[1],
        REPAIR_CASE_FOCUS_POSITION[2] + offset[2],
      ],
    }),
  );
}

function getBrokenPartTargetPositions(
  part: RepairScannedBrokenPart,
  placeholderTargets: readonly RepairCasePlaceholder[],
): readonly Vector3Tuple[] {
  if (!part.placeholderName) {
    return placeholderTargets.map((placeholder) => placeholder.position);
  }

  const matchingPlaceholder = placeholderTargets.find(
    (placeholder) => placeholder.name === part.placeholderName,
  );

  return matchingPlaceholder
    ? [matchingPlaceholder.position]
    : placeholderTargets.map((placeholder) => placeholder.position);
}

function isNearPlaceholder(
  position: THREE.Vector3,
  placeholderPositions: readonly Vector3Tuple[],
): boolean {
  return placeholderPositions.some(
    (placeholderPosition) =>
      position.distanceTo(_placeholderPosition.set(...placeholderPosition)) <=
      REPAIR_INSTALL_RADIUS,
  );
}

function getReplacementParts(
  config: RepairMissionConfig,
): readonly RepairMissionPartConfig[] {
  if (config.replacementParts.length > 0) return config.replacementParts;

  return [
    {
      id: config.requiredReplacementPartId,
      label: config.label,
      modelPath: config.modelPath,
    },
  ];
}

function getBrokenPartsToDeposit(
  config: RepairMissionConfig,
  brokenParts: readonly RepairScannedBrokenPart[],
): readonly RepairScannedBrokenPart[] {
  if (brokenParts.length > 0) return brokenParts;

  return config.brokenParts.map((part) => ({
    id: part.id,
    label: part.label,
    modelPath: part.modelPath ?? config.modelPath,
    ...(part.placeholderName ? { placeholderName: part.placeholderName } : {}),
  }));
}
