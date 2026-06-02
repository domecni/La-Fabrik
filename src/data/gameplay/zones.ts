import type { ZoneConfig } from "@/types/gameplay/zone";
import { PYLON_WORLD_POSITION } from "@/data/gameplay/pylonConfig";

// Zones qui active la coupure de courant
export const PYLON_APPROACH_ZONE: ZoneConfig = {
  id: "pylon-approach",
  position: [
    5, 
    4,
    -21.5
  ],
  radius: 10,
  height: 18,
  oneShot: true,
};

// Zone qui active la cinématique d'arrivée du pylône
export const PYLON_ARRIVED_ZONE: ZoneConfig = {
  id: "pylon-arrived",
  position: [
    PYLON_WORLD_POSITION[0],
    PYLON_WORLD_POSITION[1],
    PYLON_WORLD_POSITION[2],
  ],
  radius: 30,
  height: 15,
  oneShot: true,
};
