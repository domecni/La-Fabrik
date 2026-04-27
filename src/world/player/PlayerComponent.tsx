import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { Octree } from "three/addons/math/Octree.js";
import type { Vector3Tuple } from "@/types/3d";
import { PlayerCamera } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

interface PlayerComponentProps {
  octree: Octree | null;
  spawnPosition: Vector3Tuple;
}

export function PlayerComponent({
  spawnPosition,
  octree,
}: PlayerComponentProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(...spawnPosition);
  }, [camera, spawnPosition]);

  return (
    <>
      <PlayerCamera />
      <PlayerController octree={octree} spawnPosition={spawnPosition} />
    </>
  );
}
