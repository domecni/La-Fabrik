import type { RepairMissionId } from "@/types/gameplay/repairMission";

export const INTRO_MISSION_NOTIFICATION_IMAGE_PATH =
  "/assets/world/UI/intro-mission-notification.png";

export const MISSION_NOTIFICATION_IMAGE_PATHS: Record<RepairMissionId, string> =
  {
    ebike: "/assets/world/UI/ebike-mission-notification.png",
    pylon: "/assets/world/UI/pylon-mission-notification.png",
    farm: "/assets/world/UI/farm-mission-notification.png",
  };
