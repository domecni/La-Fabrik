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
} from "@/data/gameplay/repairMissions";
import type { ExplodedPart } from "@/utils/three/ExplodedModel";

interface RepairScanSequenceProps {
  config: RepairMissionConfig;
  onComplete: (brokenParts: readonly RepairScannedBrokenPart[]) => void;
}

export interface RepairScannedBrokenPart {
  id: string;
  label: string;
  modelPath: string;
  placeholderName?: string;
}

export function RepairScanSequence({
  config,
  onComplete,
}: RepairScanSequenceProps): React.JSX.Element {
  const [parts, setParts] = useState<readonly ExplodedPart[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const activePart = parts[activePartIndex];
  const brokenPartIndexes = getBrokenPartIndexes(parts, config.brokenParts);
  const visibleBrokenPartIndexes = brokenPartIndexes.filter(
    (partIndex) => partIndex <= activePartIndex,
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
    }, REPAIR_SCAN_PART_SECONDS * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePartIndex, config, onComplete, parts]);

  return (
    <group>
      <ExplodableModel
        modelPath={config.modelPath}
        split
        onPartsReady={setParts}
      />
      <RepairScanVisual target={activePart?.object} />
      {visibleBrokenPartIndexes.map((partIndex) => {
        const part = parts[partIndex];
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
  const brokenPartIndexes = getBrokenPartIndexes(parts, config.brokenParts);

  return brokenPartIndexes.map((_, index) => {
    const configuredPart = config.brokenParts[index] ?? config.brokenParts[0];

    return {
      id: configuredPart?.id ?? `${config.id}-broken-part-${index}`,
      label: configuredPart?.label ?? `${config.label} broken part`,
      modelPath: configuredPart?.modelPath ?? config.modelPath,
      ...(configuredPart?.placeholderName
        ? { placeholderName: configuredPart.placeholderName }
        : {}),
    };
  });
}

function getBrokenPartIndexes(
  parts: readonly ExplodedPart[],
  brokenParts: readonly RepairMissionPartConfig[],
): number[] {
  if (parts.length === 0 || brokenParts.length === 0) return [];

  const matchedIndexes = brokenParts.flatMap((brokenPart) => {
    const { nodeName } = brokenPart;
    if (!nodeName) return [];

    const index = parts.findIndex((part) =>
      objectContainsNodeName(part.object, nodeName),
    );

    return index >= 0 ? [index] : [];
  });

  if (matchedIndexes.length > 0) return [...new Set(matchedIndexes)];

  return parts.slice(0, brokenParts.length).map((_, index) => index);
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
