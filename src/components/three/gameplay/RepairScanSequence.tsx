import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RepairBrokenPartHighlight } from "@/components/three/gameplay/RepairBrokenPartHighlight";
import { RepairBrokenPartPrompt } from "@/components/three/gameplay/RepairBrokenPartPrompt";
import { RepairScanVisual } from "@/components/three/gameplay/RepairScanVisual";
import { REPAIR_SCAN_PART_SECONDS } from "@/data/gameplay/repairGameConfig";
import type {
  RepairMissionConfig,
  RepairMissionPartConfig,
  RepairScannedBrokenPart,
} from "@/types/gameplay/repairMission";
import { logger } from "@/utils/core/Logger";
import type { ExplodedPart } from "@/utils/three/ExplodedModel";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";

interface RepairScanSequenceProps {
  config: RepairMissionConfig;
  /**
   * Parts of the (already mounted) ExplodableModel managed upstream by
   * RepairGame. The scan sequence drives its visuals against these
   * parts so the model isn't re-instantiated when entering the scanning
   * phase (which would cause the explosion animation to replay and the
   * world transform to differ between phases).
   */
  parts: readonly ExplodedPart[];
  onComplete: (brokenParts: readonly RepairScannedBrokenPart[]) => void;
}

interface RepairBrokenPartMatch {
  config: RepairMissionPartConfig;
  partIndex: number;
}

const warnedMissingScanParts = new Set<string>();

export function RepairScanSequence({
  config,
  parts,
  onComplete,
}: RepairScanSequenceProps): React.JSX.Element {
  const [activePartIndex, setActivePartIndex] = useState(0);
  const activePart = parts[activePartIndex];
  const scanPartSeconds = config.scanPartSeconds ?? REPAIR_SCAN_PART_SECONDS;
  const brokenPartMatches = useMemo(
    () => getBrokenPartMatches(parts, config),
    [parts, config],
  );
  const visibleBrokenPartMatches = brokenPartMatches.filter(
    (match) => match.partIndex <= activePartIndex,
  );
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (parts.length === 0) return undefined;

    // Look up which (if any) broken-part config corresponds to the
    // currently active scan part. When the active part has a
    // `voiceLineId`, gate the advance on the audio's `ended` event so
    // the diagnostic line plays in full (with its red broken-part
    // highlight already on screen) before transitioning to the next
    // scan part — and ultimately to the repairing step.
    const activeBrokenMatch = brokenPartMatches.find(
      (match) => match.partIndex === activePartIndex,
    );
    const activeVoiceLineId = activeBrokenMatch?.config.voiceLineId;

    if (activeVoiceLineId) {
      let cancelled = false;
      let activeAudio: HTMLAudioElement | null = null;
      let fallbackTimeoutId: number | null = null;

      const advance = (): void => {
        if (cancelled) return;
        cancelled = true;
        setActivePartIndex((currentIndex) => {
          const nextIndex = currentIndex + 1;
          if (nextIndex >= parts.length) {
            window.setTimeout(() => {
              onCompleteRef.current(getScannedBrokenParts(parts, config));
            }, 0);
            return currentIndex;
          }
          return nextIndex;
        });
      };

      void (async () => {
        const manifest = await loadDialogueManifest();
        if (cancelled) return;
        const audio = manifest
          ? await playDialogueById(manifest, activeVoiceLineId)
          : null;
        if (cancelled) {
          if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
          useSubtitleStore.getState().clearActiveSubtitle();
          return;
        }
        activeAudio = audio;
        if (audio) {
          audio.addEventListener("ended", advance, { once: true });
          // Fallback: if the audio errors or never fires `ended`, still
          // advance after a generous ceiling so the flow can't stall.
          fallbackTimeoutId = window.setTimeout(advance, 15000);
        } else {
          // No audio (manifest missing) — advance after the default
          // per-part dwell so we don't get stuck on this part.
          fallbackTimeoutId = window.setTimeout(
            advance,
            scanPartSeconds * 1000,
          );
        }
      })();

      return () => {
        cancelled = true;
        if (activeAudio) {
          activeAudio.removeEventListener("ended", advance);
          if (!activeAudio.paused) {
            activeAudio.pause();
            activeAudio.currentTime = 0;
          }
        }
        if (fallbackTimeoutId !== null) {
          window.clearTimeout(fallbackTimeoutId);
        }
        useSubtitleStore.getState().clearActiveSubtitle();
      };
    }

    const timeoutId = window.setTimeout(() => {
      setActivePartIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= parts.length) {
          window.setTimeout(() => {
            onCompleteRef.current(getScannedBrokenParts(parts, config));
          }, 0);
          return currentIndex;
        }

        return nextIndex;
      });
    }, scanPartSeconds * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePartIndex, brokenPartMatches, config, parts, scanPartSeconds]);

  return (
    <group>
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
        availablePartNames: parts.map((part) => part.object.name),
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
  const normalizedNodeName = nodeName.toLowerCase();
  const objectName = object.name.toLowerCase();
  if (objectName === normalizedNodeName) return true;
  if (objectName.includes(normalizedNodeName)) return true;
  if (normalizedNodeName.includes(objectName)) return true;

  let found = false;
  object.traverse((child) => {
    const childName = child.name.toLowerCase();
    if (
      childName === normalizedNodeName ||
      childName.includes(normalizedNodeName) ||
      normalizedNodeName.includes(childName)
    ) {
      found = true;
    }
  });

  return found;
}
