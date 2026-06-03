import type {
  RepairMissionCaseConfig,
  RepairMissionConfig,
  RepairMissionId,
} from "@/types/gameplay/repairMission";
import {
  EBIKE_DIAGNOSTIC_DIALOGUE_ID,
  EBIKE_WORLD_ROTATION_Y,
  EBIKE_WORLD_SCALE,
} from "@/data/ebike/ebikeConfig";

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
    modelScale: EBIKE_WORLD_SCALE,
    modelRotation: [0, EBIKE_WORLD_ROTATION_Y, 0],
    stageUiPath: "/assets/world/UI/ebike-mission-notification.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    requiredReplacementPartIds: ["ebike-cooling-core-replacement"],
    brokenParts: [
      {
        id: "ebike-cooling-core",
        label: "Cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
        nodeName: "refroidisseur",
        targetNodeName: "refroidisseur",
        caseSlotName: "placeholder_1",
        // Plays during the scan landing on the refroidisseur node;
        // the scan sequence advances on this audio's `ended` event.
        voiceLineId: EBIKE_DIAGNOSTIC_DIALOGUE_ID,
      },
    ],
    replacementParts: [
      {
        id: "ebike-cooling-core-replacement",
        label: "Refroidisseur",
        modelPath: "/models/refroidisseur/model.gltf",
        caseAnchor: "refroidisseur",
        targetNodeName: "refroidisseur",
      },
      {
        id: "ebike-cable-right-distractor",
        label: "Câble droit",
        modelPath: "/models/cable1/model.gltf",
        caseAnchor: "cabledroit",
      },
      {
        id: "ebike-cable-left-distractor",
        label: "Câble gauche",
        modelPath: "/models/cable2/model.gltf",
        caseAnchor: "cablegauche",
      },
      {
        id: "ebike-puce-haut-distractor",
        label: "Puce haute",
        modelPath: "/models/puce/model.gltf",
        caseAnchor: "pucehaut",
      },
      {
        id: "ebike-puce-bas-distractor",
        label: "Puce basse",
        modelPath: "/models/puce/model.gltf",
        caseAnchor: "pucebas",
      },
    ],
  },
  pylon: {
    id: "pylon",
    label: "Power pylon",
    description:
      "Restore the pylon lamp relay and damaged panel before reconnecting the grid",
    modelPath: "/models/pylone/model.glb",
    stageUiPath: "/assets/world/UI/pylon-mission-notification.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    reassemblySeconds: 1.8,
    requiredReplacementPartIds: [
      "pylon-cable-right-replacement",
      "pylon-cable-left-replacement",
    ],
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
        nodeName: "pylone",
        caseSlotName: "placeholder_2",
      },
    ],
    replacementParts: [
      {
        id: "pylon-cable-right-replacement",
        label: "Câble droit",
        modelPath: "/models/cable1/model.gltf",
        caseAnchor: "cabledroit",
        caseLockGroup: "pylon-cable",
        targetNodeName: "cable2",
      },
      {
        id: "pylon-cable-left-replacement",
        label: "Câble gauche",
        modelPath: "/models/cable2/model.gltf",
        caseAnchor: "cablegauche",
        caseLockGroup: "pylon-cable",
        targetNodeName: "cable2",
      },
      {
        id: "pylon-cooling-distractor",
        label: "Refroidisseur",
        modelPath: "/models/refroidisseur/model.gltf",
        caseAnchor: "refroidisseur",
      },
      {
        id: "pylon-puce-haut-distractor",
        label: "Puce haute",
        modelPath: "/models/puce/model.gltf",
        caseAnchor: "pucehaut",
      },
      {
        id: "pylon-puce-bas-distractor",
        label: "Puce basse",
        modelPath: "/models/puce/model.gltf",
        caseAnchor: "pucebas",
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
    requiredReplacementPartIds: ["farm-irrigation-pump-replacement"],
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
    ],
  },
};
