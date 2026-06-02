import { useEffect, useState } from "react";
import * as THREE from "three";
import { RepairBrokenPartHighlight } from "@/components/three/gameplay/RepairBrokenPartHighlight";
import { RepairBrokenPartPrompt } from "@/components/three/gameplay/RepairBrokenPartPrompt";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import { RepairScanVisual } from "@/components/three/gameplay/RepairScanVisual";
import { REPAIR_SCAN_PART_SECONDS } from "@/data/gameplay/repairGameConfig";
import type {
  RepairMissionConfig,
  RepairMissionPartConfig,
  RepairScannedBrokenPart,
} from "@/types/gameplay/repairMission";
import { logger } from "@/utils/core/Logger";
import type { ExplodedPart } from "@/utils/three/ExplodedModel";

interface RepairScanSequenceProps {
  config: RepairMissionConfig;
  onComplete: (brokenParts: readonly RepairScannedBrokenPart[]) => void;
}

interface RepairBrokenPartMatch {
  config: RepairMissionPartConfig;
  partIndex: number;
}

const warnedMissingScanParts = new Set<string>();

export function RepairScanSequence({
  config,
  onComplete,
}: RepairScanSequenceProps): React.JSX.Element {
  const [parts, setParts] = useState<readonly ExplodedPart[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const activePart = parts[activePartIndex];
  const scanPartSeconds = config.scanPartSeconds ?? REPAIR_SCAN_PART_SECONDS;
  const brokenPartMatches = getBrokenPartMatches(parts, config);
  const visibleBrokenPartMatches = brokenPartMatches.filter(
    (match) => match.partIndex <= activePartIndex,
  );

  useEffect(() => {
    if (parts.length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActivePartIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= parts.length) {
          onComplete(getScannedBrokenParts(parts, config));
          return currentIndex;
        }

        return nextIndex;
      });
    }, scanPartSeconds * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePartIndex, config, onComplete, parts, scanPartSeconds]);

  return (
    <group>
      <ExplodableModel
        modelPath={config.modelPath}
        scale={config.modelScale ?? 1}
        split
        onPartsReady={setParts}
      />
      <RepairScanVisual target={activePart?.object} />
      {visibleBrokenPartMatches.map((match) => {
        const part = parts[match.partIndex];
        if (!part) return null;

        return (
          <group key={part.object.uuid}>
            <RepairBrokenPartHighlight target={part.object} />
            <RepairBrokenPartPrompt
              src={config.brokenUiPath}
              target={part.object}
            />
          </group>
        );
      })}
    </group>
  );
}

function getScannedBrokenParts(
  parts: readonly ExplodedPart[],
  config: RepairMissionConfig,
): readonly RepairScannedBrokenPart[] {
  return getBrokenPartMatches(parts, config).map((match) => {
    return {
      id: match.config.id,
      label: match.config.label,
      modelPath: match.config.modelPath ?? config.modelPath,
      ...(match.config.caseSlotName
        ? { caseSlotName: match.config.caseSlotName }
        : {}),
      ...(match.config.targetNodeName
        ? { targetNodeName: match.config.targetNodeName }
        : {}),
    };
  });
}

function getBrokenPartMatches(
  parts: readonly ExplodedPart[],
  config: RepairMissionConfig,
): RepairBrokenPartMatch[] {
  if (parts.length === 0 || config.brokenParts.length === 0) return [];

  const matches = config.brokenParts.flatMap((brokenPart) => {
    const { nodeName } = brokenPart;
    if (!nodeName) return [];

    const index = parts.findIndex((part) =>
      objectContainsNodeName(part.object, nodeName),
    );

    return index >= 0 ? [{ config: brokenPart, partIndex: index }] : [];
  });

  if (matches.length !== config.brokenParts.length) {
    const matchedIds = new Set(matches.map((match) => match.config.id));
    const missingIds = config.brokenParts
      .filter((brokenPart) => !matchedIds.has(brokenPart.id))
      .map((brokenPart) => brokenPart.id);

    const warningKey = `${config.id}:${missingIds.join(",")}`;
    if (!warnedMissingScanParts.has(warningKey)) {
      warnedMissingScanParts.add(warningKey);
      logger.warn("RepairScan", "Broken parts missing from exploded model", {
        missionId: config.id,
        missingIds,
      });
    }
  }

  return matches.filter(
    (match, index, allMatches) =>
      allMatches.findIndex((item) => item.partIndex === match.partIndex) ===
      index,
  );
}

function objectContainsNodeName(
  object: THREE.Object3D,
  nodeName: string,
): boolean {
  if (object.name === nodeName) return true;

  let found = false;
  object.traverse((child) => {
    if (child.name === nodeName) {
      found = true;
    }
  });

  return found;
}
