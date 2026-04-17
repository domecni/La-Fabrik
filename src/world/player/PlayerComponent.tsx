import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { Octree } from "three/addons/math/Octree.js";
import { PlayerCamera } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

interface PlayerComponentProps {
  octree?: Octree | null;
  spawnY?: number;
}

export function PlayerComponent({
  octree = null,
  spawnY = 100,
}: PlayerComponentProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(0, spawnY, 0);
  }, [camera, spawnY]);

  return (
    <>
      <PlayerCamera />
      <PlayerController octree={octree} />
    </>
  );
}
