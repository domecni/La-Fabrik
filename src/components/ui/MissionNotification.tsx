import { MISSION_NOTIFICATION_IMAGE_PATHS } from "@/data/gameplay/missionNotifications";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

interface MissionNotificationProps {
  mission: RepairMissionId;
  visible?: boolean;
}

export function MissionNotification({
  mission,
  visible = true,
}: MissionNotificationProps): React.JSX.Element {
  return (
    <div
      className={`mission-notification${visible ? "" : " mission-notification--hidden"}`}
      aria-live="polite"
    >
      <div className="mission-notification__glow" />
      <span className="mission-notification__image-wrap">
        <img
          className="mission-notification__image"
          src={MISSION_NOTIFICATION_IMAGE_PATHS[mission]}
          alt="Nouvel objectif de mission"
        />
      </span>
    </div>
  );
}
