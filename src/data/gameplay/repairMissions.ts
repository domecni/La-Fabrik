import type {
  RepairMissionCaseConfig,
  RepairMissionConfig,
  RepairMissionId,
} from "@/types/gameplay/repairMission";

const REPAIR_INTERACT_UI_PATH = "/assets/world/UI/interagir.webm";
const REPAIR_BROKEN_UI_PATH = "/assets/world/UI/cassé.webm";

const DEFAULT_REPAIR_CASE = {
  position: [0, 0.4, 1.8],
  rotation: [0, 0, 0],
  scale: 1.5,
} satisfies RepairMissionCaseConfig;

export const REPAIR_MISSIONS: Record<RepairMissionId, RepairMissionConfig> = {
  ebike: {
    id: "ebike",
    label: "E-bike",
    description:
      "Repair the damaged cooling module before relaunching the bike",
    modelPath: "/models/ebike/model.gltf",
    modelScale: 0.3,
    stageUiPath: "/assets/world/UI/ebike-mission-notification.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    requiredReplacementPartId: "ebike-cooling-core-replacement",
    brokenParts: [
      {
        id: "ebike-cooling-core",
        label: "Cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
        nodeName: "refroidisseur",
        caseSlotName: "placeholder_1",
      },
    ],
    replacementParts: [
      {
        id: "ebike-cooling-core-replacement",
        label: "Replacement cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
      },
      {
        id: "ebike-glove-distractor",
        label: "Insulation glove",
        modelPath: "/models/gant_l/model.gltf",
      },
    ],
  },
  pylon: {
    id: "pylon",
    label: "Power pylon",
    description:
      "Restore the pylon lamp relay and damaged panel before reconnecting the grid",
    modelPath: "/models/pylone/model.gltf",
    stageUiPath: "/assets/world/UI/pylon-mission-notification.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    reassemblySeconds: 1.8,
    requiredReplacementPartId: "pylon-grid-relay-replacement",
    scanPartSeconds: 1.4,
    brokenParts: [
      {
        id: "pylon-grid-relay",
        label: "Grid relay",
        nodeName: "lampe",
        caseSlotName: "placeholder_1",
      },
      {
        id: "pylon-damaged-panel",
        label: "Damaged solar panel",
        nodeName: "panneau2",
        caseSlotName: "placeholder_2",
      },
    ],
    replacementParts: [
      {
        id: "pylon-grid-relay-replacement",
        label: "Replacement grid relay",
        modelPath: "/models/pylone/model.gltf",
      },
      {
        id: "pylon-stone-distractor",
        label: "Stone counterweight",
        modelPath: "/models/galet/model.gltf",
      },
      {
        id: "pylon-cooling-distractor",
        label: "Cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
      },
    ],
  },
  farm: {
    id: "farm",
    label: "Vertical farm",
    description:
      "Stabilize the irrigation loop and humidity sensor before restarting the farm",
    modelPath: "/models/fermeverticale/model.gltf",
    stageUiPath: "/assets/world/UI/farm-mission-notification.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    reassemblySeconds: 1.2,
    requiredReplacementPartId: "farm-irrigation-pump-replacement",
    scanPartSeconds: 0.9,
    brokenParts: [
      {
        id: "farm-irrigation-pump",
        label: "Irrigation pump",
        caseSlotName: "placeholder_1",
      },
      {
        id: "farm-humidity-sensor",
        label: "Humidity sensor",
        caseSlotName: "placeholder_2",
      },
    ],
    replacementParts: [
      {
        id: "farm-irrigation-pump-replacement",
        label: "Replacement irrigation pump",
        modelPath: "/models/fermeverticale/model.gltf",
      },
      {
        id: "farm-tree-distractor",
        label: "Tree sensor",
        modelPath: "/models/sapin/model.gltf",
      },
      {
        id: "farm-radio-distractor",
        label: "Radio module",
        modelPath: "/models/talkie/model.glb",
      },
    ],
  },
};
