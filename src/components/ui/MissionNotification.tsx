import { MISSION_NOTIFICATION_IMAGE_PATHS } from "@/data/gameplay/missionNotifications";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

interface MissionNotificationProps {
  mission?: RepairMissionId;
  imagePath?: string;
  visible?: boolean;
}

export function MissionNotification({
  mission,
  imagePath,
  visible = true,
}: MissionNotificationProps): React.JSX.Element {
  const src =
    imagePath ?? (mission ? MISSION_NOTIFICATION_IMAGE_PATHS[mission] : "");

  return (
    <div
      className={`mission-notification${visible ? "" : " mission-notification--hidden"}`}
      aria-live="polite"
    >
      <div className="mission-notification__glow" />
      <span className="mission-notification__image-wrap">
        <img
          className="mission-notification__image"
          src={src}
          alt="Nouvel objectif de mission"
        />
      </span>
    </div>
  );
}
