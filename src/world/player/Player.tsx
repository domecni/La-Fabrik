import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { Octree } from "three-stdlib";
import type { Vector3Tuple } from "@/types/three/three";
import { PlayerCamera } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

interface PlayerProps {
  octree: Octree | null;
  initialLookAt?: Vector3Tuple | undefined;
  spawnPosition: Vector3Tuple;
}

export function Player({
  initialLookAt,
  spawnPosition,
  octree,
}: PlayerProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.position.set(...spawnPosition);
    if (initialLookAt) camera.lookAt(...initialLookAt);
  }, [camera, initialLookAt, spawnPosition]);

  return (
    <>
      <PlayerCamera />
      <PlayerController
        initialLookAt={initialLookAt}
        octree={octree}
        spawnPosition={spawnPosition}
      />
    </>
  );
}
