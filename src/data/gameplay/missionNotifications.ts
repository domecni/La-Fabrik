import type { RepairMissionId } from "@/types/gameplay/repairMission";
import { assetUrl } from "@/utils/assetUrl";

export const INTRO_MISSION_NOTIFICATION_IMAGE_PATH = assetUrl(
  "/assets/world/UI/intro-mission-notification.png",
);

export const MISSION_NOTIFICATION_IMAGE_PATHS: Record<RepairMissionId, string> =
  {
    ebike: assetUrl("/assets/world/UI/ebike.webm"),
    pylon: assetUrl("/assets/world/UI/centrale.webm"),
    farm: assetUrl("/assets/world/UI/laferme.webm"),
  };
