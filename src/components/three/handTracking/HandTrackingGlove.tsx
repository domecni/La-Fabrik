import type { ReactNode } from "react";
import { Component, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import {
  useHandTrackingGloveStatus,
  type HandTrackingGloveHandedness,
} from "@/hooks/handTracking/useHandTrackingGloveStatus";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import type { HandTrackingLandmark } from "@/types/handTracking/handTracking";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

const GLOVE_CONFIGS: Record<
  HandTrackingGloveHandedness,
  {
    modelPath: string;
    rootNodeName: string;
  }
> = {
  left: {
    modelPath: "/models/gant_l/model.gltf",
    rootNodeName: "Armature",
  },
  right: {
    modelPath: "/models/gant_r/model.gltf",
    rootNodeName: "Hand_r",
  },
};

const GLOVE_MODEL_SCALE = 0.33;
const HAND_SPACE_DISTANCE = 0.5;
const HAND_TRACKING_HIDE_DELAY_MS = 250;

const FINGER_LANDMARK_CHAINS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [0, 9, 10, 11, 12],
  [0, 13, 14, 15, 16],
  [0, 17, 18, 19, 20],
] as const;

const _cameraPosition = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _xAxis = new THREE.Vector3();
const _yAxis = new THREE.Vector3();
const _zAxis = new THREE.Vector3();
const _matrix = new THREE.Matrix4();
const _parentInverse = new THREE.Matrix4();
const _targetQuaternion = new THREE.Quaternion();
const _boneTargetQuaternion = new THREE.Quaternion();
const _boneDeltaQuaternion = new THREE.Quaternion();
const _targetPosition = new THREE.Vector3();
const _localSegmentStart = new THREE.Vector3();
const _localSegmentEnd = new THREE.Vector3();
const _localSegmentDirection = new THREE.Vector3();
const _wristPosition = new THREE.Vector3();
const _indexPosition = new THREE.Vector3();
const _middlePosition = new THREE.Vector3();
const _ringPosition = new THREE.Vector3();
const _pinkyPosition = new THREE.Vector3();

interface FingerBonePose {
  bone: THREE.Object3D;
  restDirection: THREE.Vector3;
  restQuaternion: THREE.Quaternion;
}

type FingerPoseChain = FingerBonePose[];

interface HandTrackingGloveProps {
  handedness: HandTrackingGloveHandedness;
}

interface HandTrackingGloveErrorBoundaryProps {
  children: ReactNode;
  handedness: HandTrackingGloveHandedness;
  modelPath: string;
}

class HandTrackingGloveErrorBoundary extends Component<
  HandTrackingGloveErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: HandTrackingGloveErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    useHandTrackingGloveStatus
      .getState()
      .setGloveStatus(this.props.handedness, "error");

    logModelLoadError(
      {
        modelPath: this.props.modelPath,
        scope: `HandTrackingGlove.${this.props.handedness}`,
        scale: GLOVE_MODEL_SCALE,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) return null;

    return this.props.children;
  }
}

function landmarkToWorldPoint(
  landmark: HandTrackingLandmark,
  camera: THREE.Camera,
  target: THREE.Vector3,
): THREE.Vector3 {
  _cameraPosition.setFromMatrixPosition(camera.matrixWorld);
  target.set((1 - landmark.x) * 2 - 1, -landmark.y * 2 + 1, 0.5);
  target.unproject(camera);

  _direction.copy(target).sub(_cameraPosition).normalize();
  target.copy(_cameraPosition).addScaledVector(_direction, HAND_SPACE_DISTANCE);

  return target;
}

function matchesHandedness(
  handHandedness: string,
  targetHandedness: HandTrackingGloveHandedness,
): boolean {
  return handHandedness.toLowerCase() === targetHandedness;
}

function getFirstChildBone(object: THREE.Object3D): THREE.Object3D | null {
  return object.children.find((child) => child.type === "Bone") ?? null;
}

function createFingerBonePose(bone: THREE.Object3D): FingerBonePose {
  const firstChild = getFirstChildBone(bone);
  const restDirection = firstChild
    ? firstChild.position.clone()
    : new THREE.Vector3(0, 1, 0);

  restDirection.applyQuaternion(bone.quaternion).normalize();

  return {
    bone,
    restDirection,
    restQuaternion: bone.quaternion.clone(),
  };
}

function createFingerPoseChain(startBone: THREE.Object3D): FingerPoseChain {
  const chain: FingerPoseChain = [];
  let currentBone: THREE.Object3D | null = startBone;

  while (currentBone && chain.length < 4) {
    chain.push(createFingerBonePose(currentBone));
    currentBone = getFirstChildBone(currentBone);
  }

  return chain;
}

function createFingerPoseChains(root: THREE.Object3D): FingerPoseChain[] {
  const rootBone = root.getObjectByName("Bone");

  if (!rootBone) return [];

  return rootBone.children
    .filter((child) => child.type === "Bone")
    .slice(0, FINGER_LANDMARK_CHAINS.length)
    .map(createFingerPoseChain);
}

function resetFingerPose(chains: FingerPoseChain[]): void {
  for (const chain of chains) {
    for (const pose of chain) {
      pose.bone.quaternion.copy(pose.restQuaternion);
    }
  }
}

function applyFingerPose(
  chains: FingerPoseChain[],
  landmarks: HandTrackingLandmark[],
  camera: THREE.Camera,
): void {
  for (let fingerIndex = 0; fingerIndex < chains.length; fingerIndex += 1) {
    const chain = chains[fingerIndex];
    const landmarkChain = FINGER_LANDMARK_CHAINS[fingerIndex];

    if (!chain || !landmarkChain) continue;

    for (let boneIndex = 0; boneIndex < chain.length; boneIndex += 1) {
      const pose = chain[boneIndex];
      const fromLandmark = landmarks[landmarkChain[boneIndex] ?? -1];
      const toLandmark = landmarks[landmarkChain[boneIndex + 1] ?? -1];
      const parent = pose?.bone.parent;

      if (!pose || !fromLandmark || !toLandmark || !parent) continue;

      landmarkToWorldPoint(fromLandmark, camera, _localSegmentStart);
      landmarkToWorldPoint(toLandmark, camera, _localSegmentEnd);

      parent.updateWorldMatrix(true, false);
      _parentInverse.copy(parent.matrixWorld).invert();
      _localSegmentStart.applyMatrix4(_parentInverse);
      _localSegmentEnd.applyMatrix4(_parentInverse);
      _localSegmentDirection
        .copy(_localSegmentEnd)
        .sub(_localSegmentStart)
        .normalize();

      if (_localSegmentDirection.lengthSq() === 0) continue;

      _boneDeltaQuaternion.setFromUnitVectors(
        pose.restDirection,
        _localSegmentDirection,
      );
      _boneTargetQuaternion
        .copy(_boneDeltaQuaternion)
        .multiply(pose.restQuaternion);
      pose.bone.quaternion.slerp(_boneTargetQuaternion, 0.45);
    }
  }
}

function HandTrackingGloveModel({
  handedness,
}: HandTrackingGloveProps): React.JSX.Element | null {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { hands } = useHandTrackingSnapshot();
  const setGloveStatus = useHandTrackingGloveStatus(
    (state) => state.setGloveStatus,
  );
  const config = GLOVE_CONFIGS[handedness];
  const modelPath = config.modelPath;
  const gltf = useLoggedGLTF(modelPath, {
    scope: `HandTrackingGlove.${handedness}`,
    scale: GLOVE_MODEL_SCALE,
  });
  const lastTrackedAtRef = useRef<number | null>(null);
  const gloveScene = useMemo(() => {
    const rootNode = gltf.scene.getObjectByName(config.rootNodeName);

    if (!rootNode) {
      throw new Error(`Missing glove root node ${config.rootNodeName}`);
    }

    const clonedRootNode = SkeletonUtils.clone(rootNode);
    clonedRootNode.visible = false;

    return clonedRootNode;
  }, [config.rootNodeName, gltf.scene]);
  const fingerPoseChains = useMemo(
    () => createFingerPoseChains(gloveScene),
    [gloveScene],
  );

  useEffect(() => {
    setGloveStatus(handedness, "loaded");
  }, [handedness, setGloveStatus]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const trackedHand = hands.find((candidate) =>
      matchesHandedness(candidate.handedness, handedness),
    );

    if (!group) return;

    if (!trackedHand || trackedHand.landmarks.length < 21) {
      const lastTrackedAt = lastTrackedAtRef.current;
      const shouldHide =
        lastTrackedAt === null ||
        performance.now() - lastTrackedAt > HAND_TRACKING_HIDE_DELAY_MS;

      if (shouldHide) {
        group.visible = false;
        resetFingerPose(fingerPoseChains);
      }

      return;
    }

    lastTrackedAtRef.current = performance.now();
    group.visible = true;

    const wrist = trackedHand.landmarks[0];
    const indexMcp = trackedHand.landmarks[5];
    const middleMcp = trackedHand.landmarks[9];
    const ringMcp = trackedHand.landmarks[13];
    const pinkyMcp = trackedHand.landmarks[17];

    if (!wrist || !indexMcp || !middleMcp || !ringMcp || !pinkyMcp) {
      group.visible = false;
      return;
    }

    landmarkToWorldPoint(wrist, camera, _wristPosition);
    landmarkToWorldPoint(indexMcp, camera, _indexPosition);
    landmarkToWorldPoint(middleMcp, camera, _middlePosition);
    landmarkToWorldPoint(ringMcp, camera, _ringPosition);
    landmarkToWorldPoint(pinkyMcp, camera, _pinkyPosition);

    _targetPosition
      .copy(_wristPosition)
      .add(_indexPosition)
      .add(_middlePosition)
      .add(_ringPosition)
      .add(_pinkyPosition)
      .multiplyScalar(0.2);

    _yAxis.copy(_middlePosition).sub(_wristPosition).normalize();
    _xAxis.copy(_indexPosition).sub(_pinkyPosition).normalize();
    _zAxis.crossVectors(_xAxis, _yAxis).normalize();

    if (
      _xAxis.lengthSq() === 0 ||
      _yAxis.lengthSq() === 0 ||
      _zAxis.lengthSq() === 0
    ) {
      return;
    }

    _xAxis.crossVectors(_yAxis, _zAxis).normalize();
    _matrix.makeBasis(_xAxis, _yAxis, _zAxis);
    _targetQuaternion.setFromRotationMatrix(_matrix);

    group.position.lerp(_targetPosition, Math.min(1, delta * 18));
    group.quaternion.slerp(_targetQuaternion, Math.min(1, delta * 18));

    const palmLength = _wristPosition.distanceTo(_middlePosition);
    const scale = palmLength * GLOVE_MODEL_SCALE;
    group.scale.setScalar(scale);
    group.updateMatrixWorld(true);
    applyFingerPose(fingerPoseChains, trackedHand.landmarks, camera);
  });

  return <primitive ref={groupRef} object={gloveScene} />;
}

export function HandTrackingGlove({
  handedness,
}: HandTrackingGloveProps): React.JSX.Element {
  const modelPath = GLOVE_CONFIGS[handedness].modelPath;

  return (
    <HandTrackingGloveErrorBoundary
      handedness={handedness}
      modelPath={modelPath}
    >
      <HandTrackingGloveModel handedness={handedness} />
    </HandTrackingGloveErrorBoundary>
  );
}

useGLTF.preload(GLOVE_CONFIGS.left.modelPath);
useGLTF.preload(GLOVE_CONFIGS.right.modelPath);
