import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type {
  RepairCasePartAnchors,
  RepairCasePlaceholder,
} from "@/components/three/gameplay/RepairCaseModel";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import {
  REPAIR_CASE_FOCUS_POSITION,
  REPAIR_CASE_PLACEHOLDER_SNAP_DURATION,
  REPAIR_CASE_PLACEHOLDER_SNAP_RADIUS,
} from "@/data/gameplay/repairCaseConfig";
import { REPAIR_INTERACTION_RADIUS } from "@/data/gameplay/repairGameConfig";
import type {
  RepairMissionConfig,
  RepairMissionPartConfig,
  RepairScannedBrokenPart,
} from "@/types/gameplay/repairMission";
import { logger } from "@/utils/core/Logger";
import type { Vector3Tuple } from "@/types/three/three";

const INSTALL_TARGET_POSITION: Vector3Tuple = [0, 0.8, 0];
const _placeholderPosition = new THREE.Vector3();
const FALLBACK_PLACEHOLDER_OFFSETS: Vector3Tuple[] = [
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
const VALID_PART_COLOR = "#22c55e";
const INVALID_PART_COLOR = "#ef4444";
const STORED_BROKEN_PART_COLOR = "#38bdf8";
let hasWarnedMissingPlaceholders = false;

interface RepairRepairingStepProps {
  anchors?: RepairCasePartAnchors;
  brokenParts: readonly RepairScannedBrokenPart[];
  config: RepairMissionConfig;
  placeholders: readonly RepairCasePlaceholder[];
  onRepair: () => void;
}

interface RepairInstallTargetProps {
  blockedFeedback: boolean;
  fillColor: string;
  isReadyToInstall: boolean;
  label: string;
  ringColor: string;
  onBlocked: () => void;
  onRepair: () => void;
}

interface RepairPlaceholderMarkersProps {
  positions: readonly Vector3Tuple[];
}

interface RepairPartPlacementFeedbackProps {
  state: "valid" | "invalid" | "stored" | null;
}

export function RepairRepairingStep({
  anchors = {},
  brokenParts,
  config,
  placeholders,
  onRepair,
}: RepairRepairingStepProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const localPosition = useRef(new THREE.Vector3());
  const [placedPartIds, setPlacedPartIds] = useState<Record<string, boolean>>(
    {},
  );
  const [depositedBrokenPartIds, setDepositedBrokenPartIds] = useState<
    Record<string, boolean>
  >({});
  const [heldPartByLockGroup, setHeldPartByLockGroup] = useState<
    Record<string, string>
  >({});
  const [showBlockedInstallFeedback, setShowBlockedInstallFeedback] =
    useState(false);
  const replacementParts = getReplacementParts(config);
  const brokenPartsToDeposit = getBrokenPartsToDeposit(config, brokenParts);
  const requiredReplacementPart = replacementParts.find((part) =>
    config.requiredReplacementPartIds.includes(part.id),
  );
  const requiredReplacementLabel =
    requiredReplacementPart?.label ?? config.label;
  const placeholderTargets = getPlaceholderTargets(placeholders);
  const placeholderPositions = placeholderTargets.map(
    (target) => target.position,
  );
  const hasCorrectPartPlaced = config.requiredReplacementPartIds.some(
    (id) => placedPartIds[id],
  );
  const hasDepositedBrokenParts = brokenPartsToDeposit.every(
    (part) => depositedBrokenPartIds[part.id],
  );
  const hasWrongPartPlaced = replacementParts.some(
    (part) =>
      !config.requiredReplacementPartIds.includes(part.id) &&
      placedPartIds[part.id],
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
  const installLabel = isReadyToInstall
    ? `Installer ${requiredReplacementLabel}`
    : hasWrongPartPlaced
      ? `Mauvaise pièce`
      : hasCorrectPartPlaced
        ? `Ranger pièce cassée`
        : `Approcher ${requiredReplacementLabel}`;

  useEffect(() => {
    if (!showBlockedInstallFeedback) return undefined;

    const timeoutId = window.setTimeout(() => {
      setShowBlockedInstallFeedback(false);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showBlockedInstallFeedback]);

  function handleReplacementPosition(
    partId: string,
    position: THREE.Vector3,
  ): void {
    const isPlaced = isNearPlaceholder(
      getStepLocalPosition(position, groupRef.current, localPosition.current),
      placeholderPositions,
    );
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
    const isDeposited = isNearPlaceholder(
      getStepLocalPosition(position, groupRef.current, localPosition.current),
      targets,
    );
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

  function handleReplacementGrabChange(
    part: RepairMissionPartConfig,
    held: boolean,
  ): void {
    if (!part.caseLockGroup) return;
    const group = part.caseLockGroup;
    setHeldPartByLockGroup((current) => {
      if (held) {
        if (current[group] === part.id) return current;
        return { ...current, [group]: part.id };
      }
      if (current[group] !== part.id) return current;
      const next = { ...current };
      delete next[group];
      return next;
    });
  }

  return (
    <group ref={groupRef}>
      <RepairInstallTarget
        blockedFeedback={showBlockedInstallFeedback}
        fillColor={installFillColor}
        isReadyToInstall={isReadyToInstall}
        label={installLabel}
        ringColor={installColor}
        onBlocked={() => setShowBlockedInstallFeedback(true)}
        onRepair={onRepair}
      />

      <RepairPlaceholderMarkers positions={placeholderPositions} />

      {replacementParts.map((part, index) => {
        const anchorPosition = part.caseAnchor
          ? anchors[part.caseAnchor]
          : undefined;
        const placeholderPosition =
          anchorPosition ??
          placeholderPositions[index % placeholderPositions.length] ??
          placeholderPositions[0]!;
        const isPlaced = Boolean(placedPartIds[part.id]);
        const feedbackState = getReplacementFeedbackState(
          part.id,
          config.requiredReplacementPartIds,
          isPlaced,
        );
        const lockedByOther =
          part.caseLockGroup !== undefined &&
          heldPartByLockGroup[part.caseLockGroup] !== undefined &&
          heldPartByLockGroup[part.caseLockGroup] !== part.id;

        return (
          <GrabbableObject
            key={part.id}
            position={placeholderPosition}
            colliders="ball"
            handControlled
            disabled={lockedByOther}
            label={`Prendre ${part.label}`}
            onGrabChange={(held) => {
              handleReplacementGrabChange(part, held);
            }}
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
            <group>
              <RepairObjectModel
                label={part.label}
                modelPath={part.modelPath ?? config.modelPath}
                scale={0.36}
                ghosted={lockedByOther}
              />
              <RepairPartPlacementFeedback state={feedbackState} />
            </group>
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
        const isDeposited = Boolean(depositedBrokenPartIds[part.id]);

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
              <RepairPartPlacementFeedback
                state={isDeposited ? "stored" : null}
              />
            </group>
          </GrabbableObject>
        );
      })}

      {isReadyToInstall ? (
        <RepairPromptVideo src={config.interactUiPath} position={[0, 2.3, 0]} />
      ) : null}
    </group>
  );
}

function RepairInstallTarget({
  blockedFeedback,
  fillColor,
  isReadyToInstall,
  label,
  ringColor,
  onBlocked,
  onRepair,
}: RepairInstallTargetProps): React.JSX.Element {
  return (
    <TriggerObject
      position={INSTALL_TARGET_POSITION}
      colliders="ball"
      label={label}
      radius={REPAIR_INTERACTION_RADIUS}
      onTrigger={() => {
        if (!isReadyToInstall) {
          onBlocked();
          return;
        }

        onRepair();
      }}
    >
      <mesh>
        <torusGeometry args={[0.95, 0.045, 12, 96]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.9, 96]} />
        <meshBasicMaterial color={fillColor} transparent opacity={0.35} />
      </mesh>
      {blockedFeedback ? (
        <group position={[0, 0.28, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.08, 0.035, 12, 96]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.95} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.95} />
          </mesh>
        </group>
      ) : null}
    </TriggerObject>
  );
}

function RepairPlaceholderMarkers({
  positions,
}: RepairPlaceholderMarkersProps): React.JSX.Element {
  return (
    <>
      {positions.map((position, index) => (
        <mesh
          key={`${position.join(":")}-${index}`}
          position={position}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.26, 0.018, 8, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
        </mesh>
      ))}
    </>
  );
}

function RepairPartPlacementFeedback({
  state,
}: RepairPartPlacementFeedbackProps): React.JSX.Element | null {
  if (!state) return null;

  const color = getPlacementFeedbackColor(state);

  return (
    <group position={[0, 0.72, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.48, 0.035, 12, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function getPlacementFeedbackColor(
  state: NonNullable<RepairPartPlacementFeedbackProps["state"]>,
): string {
  if (state === "valid") return VALID_PART_COLOR;
  if (state === "stored") return STORED_BROKEN_PART_COLOR;

  return INVALID_PART_COLOR;
}

function getReplacementFeedbackState(
  partId: string,
  requiredPartIds: readonly string[],
  isPlaced: boolean,
): RepairPartPlacementFeedbackProps["state"] {
  if (!isPlaced) return null;

  return requiredPartIds.includes(partId) ? "valid" : "invalid";
}

function getPlaceholderTargets(
  placeholders: readonly RepairCasePlaceholder[],
): readonly RepairCasePlaceholder[] {
  if (placeholders.length > 0) {
    return placeholders;
  }

  if (!hasWarnedMissingPlaceholders) {
    hasWarnedMissingPlaceholders = true;
    logger.warn(
      "RepairGame",
      "Repair case placeholders missing, using fallback slots",
    );
  }

  return FALLBACK_PLACEHOLDER_OFFSETS.map(
    (offset, index): RepairCasePlaceholder => ({
      name: `placeholder_${index + 1}`,
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
  if (!part.caseSlotName) {
    return placeholderTargets.map((placeholder) => placeholder.position);
  }

  const matchingPlaceholder = placeholderTargets.find(
    (placeholder) => placeholder.name === part.caseSlotName,
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

function getStepLocalPosition(
  worldPosition: THREE.Vector3,
  group: THREE.Group | null,
  target: THREE.Vector3,
): THREE.Vector3 {
  target.copy(worldPosition);
  group?.worldToLocal(target);

  return target;
}

function getReplacementParts(
  config: RepairMissionConfig,
): readonly RepairMissionPartConfig[] {
  if (config.replacementParts.length > 0) return config.replacementParts;

  const fallbackId =
    config.requiredReplacementPartIds[0] ?? `${config.id}-replacement`;

  return [
    {
      id: fallbackId,
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
    ...(part.caseSlotName ? { caseSlotName: part.caseSlotName } : {}),
  }));
}
