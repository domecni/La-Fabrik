import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import {
  REPAIR_CASE_ANIMATION_DURATION,
  REPAIR_CASE_CLOSED_ROTATION_OFFSET_DEGREES,
  REPAIR_CASE_FLOAT_ACTIVATION_DISTANCE,
  REPAIR_CASE_FLOAT_DOWN_SPEED,
  REPAIR_CASE_FLOAT_HEIGHT,
  REPAIR_CASE_EXIT_DURATION,
  REPAIR_CASE_EXIT_Y_OFFSET,
  REPAIR_CASE_FLOAT_UP_SPEED,
  REPAIR_CASE_LID_NODE_NAME,
  REPAIR_CASE_OPEN_ROTATION_OFFSET_DEGREES,
  REPAIR_CASE_CLOSE_SOUND_PATH,
  REPAIR_CASE_OPEN_SOUND_PATH,
  REPAIR_CASE_PART_ANCHOR_FALLBACK_QUATERNION,
  REPAIR_CASE_PART_ANCHOR_FALLBACKS,
  REPAIR_CASE_PART_ANCHOR_NAMES,
  REPAIR_CASE_PLACEHOLDER_NAME_PREFIX,
  REPAIR_CASE_POP_DURATION,
  REPAIR_CASE_POP_Y_OFFSET,
  REPAIR_CASE_ROTATION_AMPLITUDE_DEGREES,
  REPAIR_CASE_ROTATION_RESET_SPEED,
  type RepairCasePartAnchorName,
} from "@/data/gameplay/repairCaseConfig";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { AudioManager } from "@/managers/AudioManager";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";
import { toVector3Scale } from "@/utils/three/scale";

export interface RepairCasePlaceholder {
  name: string;
  position: Vector3Tuple;
}

export type RepairCasePartAnchors = Partial<
  Record<RepairCasePartAnchorName, Vector3Tuple>
>;

interface RepairCaseModelProps extends ModelTransformProps {
  modelPath: string;
  open: boolean;
  exiting?: boolean;
  floating?: boolean;
  onPlaceholdersChange?:
    | ((placeholders: readonly RepairCasePlaceholder[]) => void)
    | undefined;
  onAnchorsChange?: ((anchors: RepairCasePartAnchors) => void) | undefined;
  onExitComplete?: (() => void) | undefined;
}

const CASE_CLOSED_ROTATION_OFFSET_Z = THREE.MathUtils.degToRad(
  REPAIR_CASE_CLOSED_ROTATION_OFFSET_DEGREES,
);
const CASE_OPEN_ROTATION_OFFSET_Z = THREE.MathUtils.degToRad(
  REPAIR_CASE_OPEN_ROTATION_OFFSET_DEGREES,
);
const ROTATION_AMPLITUDE = THREE.MathUtils.degToRad(
  REPAIR_CASE_ROTATION_AMPLITUDE_DEGREES,
);

export function RepairCaseModel({
  modelPath,
  open,
  exiting = false,
  floating = true,
  onPlaceholdersChange,
  onAnchorsChange,
  onExitComplete,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RepairCaseModelProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const { scene } = useLoggedGLTF(modelPath, {
    scope: "RepairCaseModel",
    position,
    rotation,
    scale,
  });
  const model = useClonedObject(scene);
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Object3D | null>(null);
  const worldPosition = useRef(new THREE.Vector3());
  const floatHeight = useRef(0);
  const animationActiveRef = useRef(false);
  const phase = useRef({ x: 0, y: 0, z: 0 });
  const pop = useRef({ scale: 0.001, yOffset: REPAIR_CASE_POP_Y_OFFSET });
  const onExitCompleteRef = useRef(onExitComplete);
  const onPlaceholdersChangeRef = useRef(onPlaceholdersChange);
  const onAnchorsChangeRef = useRef(onAnchorsChange);
  const initialOpen = useRef(open);
  const previousOpen = useRef(open);
  const openedRotationZ = useRef(0);
  const parsedScale = toVector3Scale(scale);
  const placeholderNodes = useRef<THREE.Object3D[]>([]);
  const placeholderSignature = useRef("__initial__");
  const placeholderPosition = useRef(new THREE.Vector3());
  const placeholderLocalPosition = useRef(new THREE.Vector3());
  const anchorNodes = useRef<Map<RepairCasePartAnchorName, THREE.Object3D>>(
    new Map(),
  );
  const anchorSignature = useRef("__initial__");
  const anchorWorldPosition = useRef(new THREE.Vector3());
  const anchorLocalPosition = useRef(new THREE.Vector3());

  useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  useEffect(() => {
    onPlaceholdersChangeRef.current = onPlaceholdersChange;
  }, [onPlaceholdersChange]);

  useEffect(() => {
    onAnchorsChangeRef.current = onAnchorsChange;
  }, [onAnchorsChange]);

  useEffect(() => {
    const popAnimation = pop.current;

    phase.current = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2,
    };

    gsap.to(popAnimation, {
      scale: 1,
      yOffset: 0,
      duration: REPAIR_CASE_POP_DURATION,
      ease: "back.out(1.7)",
    });

    return () => {
      gsap.killTweensOf(popAnimation);
    };
  }, []);

  useEffect(() => {
    if (!exiting) return undefined;

    const popAnimation = pop.current;
    gsap.to(popAnimation, {
      scale: 0.001,
      yOffset: REPAIR_CASE_EXIT_Y_OFFSET,
      duration: REPAIR_CASE_EXIT_DURATION,
      ease: "back.in(1.4)",
      overwrite: true,
      onComplete: () => {
        onExitCompleteRef.current?.();
      },
    });

    return () => {
      gsap.killTweensOf(popAnimation);
    };
  }, [exiting]);

  useEffect(() => {
    const lid = model.getObjectByName(REPAIR_CASE_LID_NODE_NAME);
    lidRef.current = lid ?? null;
    openedRotationZ.current = lid?.rotation.z ?? 0;
    placeholderNodes.current = [];

    model.traverse((child) => {
      if (
        child.name.toLowerCase().startsWith(REPAIR_CASE_PLACEHOLDER_NAME_PREFIX)
      ) {
        placeholderNodes.current.push(child);
      }
    });

    // Resolve part anchor nodes (cabledroit, cablegauche, pucehaut, pucebas,
    // refroidisseur). Existing GLTF nodes are reused and their meshes are
    // hidden so the standalone model injected at the same position becomes
    // the only visible representation. Missing nodes are created on the fly
    // at the configured fallback case-local position.
    anchorNodes.current = new Map();
    REPAIR_CASE_PART_ANCHOR_NAMES.forEach((anchorName) => {
      let node = model.getObjectByName(anchorName);
      if (node) {
        node.traverse((descendant) => {
          if ((descendant as THREE.Mesh).isMesh) {
            descendant.visible = false;
          }
        });
      } else {
        const placeholder = new THREE.Object3D();
        placeholder.name = anchorName;
        const fallback = REPAIR_CASE_PART_ANCHOR_FALLBACKS[anchorName];
        placeholder.position.set(fallback[0], fallback[1], fallback[2]);
        placeholder.quaternion.set(
          REPAIR_CASE_PART_ANCHOR_FALLBACK_QUATERNION[0],
          REPAIR_CASE_PART_ANCHOR_FALLBACK_QUATERNION[1],
          REPAIR_CASE_PART_ANCHOR_FALLBACK_QUATERNION[2],
          REPAIR_CASE_PART_ANCHOR_FALLBACK_QUATERNION[3],
        );
        model.add(placeholder);
        node = placeholder;
      }
      anchorNodes.current.set(anchorName, node);
    });

    if (lid) {
      lid.rotation.z =
        openedRotationZ.current +
        (initialOpen.current
          ? CASE_OPEN_ROTATION_OFFSET_Z
          : CASE_CLOSED_ROTATION_OFFSET_Z);
    }
  }, [model]);

  useEffect(() => {
    const lid = lidRef.current;
    if (!lid) return;

    const targetRotation =
      openedRotationZ.current +
      (open ? CASE_OPEN_ROTATION_OFFSET_Z : CASE_CLOSED_ROTATION_OFFSET_Z);
    gsap.to(lid.rotation, {
      z: targetRotation,
      duration: REPAIR_CASE_ANIMATION_DURATION,
      ease: "power2.inOut",
      overwrite: true,
    });

    return () => {
      gsap.killTweensOf(lid.rotation);
    };
  }, [open]);

  useEffect(() => {
    if (previousOpen.current === open) return;

    previousOpen.current = open;
    AudioManager.getInstance().playSound(
      open ? REPAIR_CASE_OPEN_SOUND_PATH : REPAIR_CASE_CLOSE_SOUND_PATH,
      0.85,
    );
  }, [open]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.getWorldPosition(worldPosition.current);
    const isNear =
      floating &&
      !exiting &&
      worldPosition.current.distanceTo(camera.position) <=
        REPAIR_CASE_FLOAT_ACTIVATION_DISTANCE;
    const targetHeight = isNear ? REPAIR_CASE_FLOAT_HEIGHT : 0;
    const floatSpeed = isNear
      ? REPAIR_CASE_FLOAT_UP_SPEED
      : REPAIR_CASE_FLOAT_DOWN_SPEED;

    floatHeight.current = THREE.MathUtils.damp(
      floatHeight.current,
      targetHeight,
      floatSpeed,
      delta,
    );
    group.position.y = position[1] + floatHeight.current + pop.current.yOffset;
    group.scale.set(
      parsedScale[0] * pop.current.scale,
      parsedScale[1] * pop.current.scale,
      parsedScale[2] * pop.current.scale,
    );

    if (placeholderNodes.current.length > 0) {
      const placeholders: RepairCasePlaceholder[] = [];
      placeholderNodes.current.forEach((child) => {
        child.getWorldPosition(placeholderPosition.current);
        placeholderLocalPosition.current.copy(placeholderPosition.current);
        group.parent?.worldToLocal(placeholderLocalPosition.current);
        placeholders.push({
          name: child.name,
          position: [
            placeholderLocalPosition.current.x,
            placeholderLocalPosition.current.y,
            placeholderLocalPosition.current.z,
          ],
        });
      });
      placeholders.sort((a, b) => a.name.localeCompare(b.name));

      const nextSignature = placeholders
        .map(
          (placeholder) =>
            `${placeholder.name}:${placeholder.position
              .map((value) => value.toFixed(3))
              .join(",")}`,
        )
        .join("|");
      if (nextSignature !== placeholderSignature.current) {
        placeholderSignature.current = nextSignature;
        onPlaceholdersChangeRef.current?.(placeholders);
      }
    }

    if (anchorNodes.current.size > 0) {
      const anchors: RepairCasePartAnchors = {};
      const signatureParts: string[] = [];
      anchorNodes.current.forEach((node, anchorName) => {
        node.getWorldPosition(anchorWorldPosition.current);
        anchorLocalPosition.current.copy(anchorWorldPosition.current);
        group.parent?.worldToLocal(anchorLocalPosition.current);
        const tuple: Vector3Tuple = [
          anchorLocalPosition.current.x,
          anchorLocalPosition.current.y,
          anchorLocalPosition.current.z,
        ];
        anchors[anchorName] = tuple;
        signatureParts.push(
          `${anchorName}:${tuple.map((value) => value.toFixed(3)).join(",")}`,
        );
      });
      signatureParts.sort();
      const nextAnchorSignature = signatureParts.join("|");
      if (nextAnchorSignature !== anchorSignature.current) {
        anchorSignature.current = nextAnchorSignature;
        onAnchorsChangeRef.current?.(anchors);
      }
    }

    animationActiveRef.current = isNear;

    if (animationActiveRef.current) {
      const time = clock.elapsedTime;
      group.rotation.x =
        rotation[0] +
        Math.sin(time * 0.7 + phase.current.x) * ROTATION_AMPLITUDE;
      group.rotation.y =
        rotation[1] +
        Math.sin(time * 0.55 + phase.current.y) * ROTATION_AMPLITUDE;
      group.rotation.z =
        rotation[2] +
        Math.sin(time * 0.8 + phase.current.z) * ROTATION_AMPLITUDE;
      return;
    }

    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      rotation[0],
      REPAIR_CASE_ROTATION_RESET_SPEED,
      delta,
    );
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      rotation[1],
      REPAIR_CASE_ROTATION_RESET_SPEED,
      delta,
    );
    group.rotation.z = THREE.MathUtils.damp(
      group.rotation.z,
      rotation[2],
      REPAIR_CASE_ROTATION_RESET_SPEED,
      delta,
    );
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={0.001}>
      <primitive object={model} />
    </group>
  );
}
