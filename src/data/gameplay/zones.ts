import type { ZoneConfig } from "@/types/gameplay/zone";
import { PYLON_WORLD_POSITION } from "@/data/gameplay/pylonConfig";

export const PYLON_APPROACH_ZONE: ZoneConfig = {
  id: "pylon-approach",
  position: [
    PYLON_WORLD_POSITION[0],
    PYLON_WORLD_POSITION[1] - 5,
    PYLON_WORLD_POSITION[2],
  ],
  radius: 5,
  height: 18,
  oneShot: true,
};

export const PYLON_ARRIVED_ZONE: ZoneConfig = {
  id: "pylon-arrived",
  position: [
    PYLON_WORLD_POSITION[0] + 5,
    PYLON_WORLD_POSITION[1] - 5,
    PYLON_WORLD_POSITION[2] + 5,
  ],
  radius: 5,
  height: 15,
  oneShot: true,
};
