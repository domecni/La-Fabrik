import type {
  RepairMissionCaseConfig,
  RepairMissionConfig,
  RepairMissionId,
} from "@/types/gameplay/repairMission";

const REPAIR_INTERACT_UI_PATH = "/assets/UI/interagir.webm";
const REPAIR_BROKEN_UI_PATH = "/assets/UI/cassé.webm";

const DEFAULT_REPAIR_CASE = {
  position: [0, 0.4, 1.8],
  rotation: [0, 0, 0],
  scale: 1.5,
} satisfies RepairMissionCaseConfig;

export const REPAIR_MISSIONS: Record<RepairMissionId, RepairMissionConfig> = {
  bike: {
    id: "bike",
    label: "E-bike",
    description:
      "Repair the damaged cooling module before relaunching the bike",
    modelPath: "/models/ebike/model.gltf",
    modelScale: 0.5,
    stageUiPath: "/assets/UI/ebike.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    requiredReplacementPartId: "bike-cooling-core-replacement",
    brokenParts: [
      {
        id: "bike-cooling-core",
        label: "Cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
        nodeName: "refroidisseur",
        caseSlotName: "placeholder_1",
      },
    ],
    replacementParts: [
      {
        id: "bike-cooling-core-replacement",
        label: "Replacement cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
      },
      {
        id: "bike-radio-distractor",
        label: "Radio module",
        modelPath: "/models/talkie/model.gltf",
      },
      {
        id: "bike-glove-distractor",
        label: "Insulation glove",
        modelPath: "/models/gant_l/model.gltf",
      },
    ],
  },
  pylone: {
    id: "pylone",
    label: "Power pylon",
    description:
      "Restore the pylon lamp relay and damaged panel before reconnecting the grid",
    modelPath: "/models/pylone/model.gltf",
    stageUiPath: "/assets/UI/centrale.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    reassemblySeconds: 1.8,
    requiredReplacementPartId: "pylone-grid-relay-replacement",
    scanPartSeconds: 1.4,
    brokenParts: [
      {
        id: "pylone-grid-relay",
        label: "Grid relay",
        nodeName: "lampe",
        caseSlotName: "placeholder_1",
      },
      {
        id: "pylone-damaged-panel",
        label: "Damaged solar panel",
        nodeName: "panneau2",
        caseSlotName: "placeholder_2",
      },
    ],
    replacementParts: [
      {
        id: "pylone-grid-relay-replacement",
        label: "Replacement grid relay",
        modelPath: "/models/pylone/model.gltf",
      },
      {
        id: "pylone-stone-distractor",
        label: "Stone counterweight",
        modelPath: "/models/galet/model.gltf",
      },
      {
        id: "pylone-cooling-distractor",
        label: "Cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
      },
    ],
  },
  ferme: {
    id: "ferme",
    label: "Vertical farm",
    description:
      "Stabilize the irrigation loop and humidity sensor before restarting the farm",
    modelPath: "/models/fermeverticale/model.gltf",
    stageUiPath: "/assets/UI/laferme.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    reassemblySeconds: 1.2,
    requiredReplacementPartId: "ferme-irrigation-pump-replacement",
    scanPartSeconds: 0.9,
    brokenParts: [
      {
        id: "ferme-irrigation-pump",
        label: "Irrigation pump",
        caseSlotName: "placeholder_1",
      },
      {
        id: "ferme-humidity-sensor",
        label: "Humidity sensor",
        caseSlotName: "placeholder_2",
      },
    ],
    replacementParts: [
      {
        id: "ferme-irrigation-pump-replacement",
        label: "Replacement irrigation pump",
        modelPath: "/models/fermeverticale/model.gltf",
      },
      {
        id: "ferme-tree-distractor",
        label: "Tree sensor",
        modelPath: "/models/sapin/model.gltf",
      },
      {
        id: "ferme-radio-distractor",
        label: "Radio module",
        modelPath: "/models/talkie/model.gltf",
      },
    ],
  },
};
