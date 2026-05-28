const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.join(__dirname, "../public/map_raw.json");
const OUTPUT_PATH = path.join(__dirname, "../public/map.json");

const MESH_NAME_MAPPINGS = {
  boitesauxlettres: "boiteauxlettres",
  pyloneelectrique: "pylone",
  eoliennes: "eolienne",
  immeuble_1: "immeuble1",
  buissons: "buisson",
  panneauxcentre: "panneauclassique",
  panneauxdomaine: "panneauclassique",
  panneaudircentre: "panneaufleche",
  panneaudirdomaine: "panneaufleche",
  panneaudirfabrik: "panneaufleche",
  panneaudirresidences1: "panneaufleche",
  panneaudirresidences2: "panneaufleche",
  panneauxquartier: "panneauaffichage",
};

const IDENTITY_NODE = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};
const REPAIR_PYLON_ANCHOR_ID = "repair:pylon";
const REPAIR_PYLON_FALLBACK_POSITION = [64, 0, -66];
const MAX_MESH_Y_PLACEMENT_OFFSET = 2;
const RAW_INDEX = {
  directionGroup: 5,
  fermeGroup: 4798,
  energieGroup: 4800,
  lafabrikGroup: 4873,
  ecoleGroup: 4895,
  residenceZoneSources: [830, 874, 892],
};
const RAW_RANGES = {
  directionPrimary: [6, 12],
  residenceZone1: [831, 873],
  residenceZone2: [875, 891],
  residenceZone3: [893, 942],
  residenceBikes: [14, 23],
  residenceMailboxes: [25, 58],
  energyPylones: [61, 96],
  vegetationPrimary: [98, 829],
  lakePipes: [944, 944],
  fields: [946, 4594],
  farm: [4595, 4799],
  vegetationFarmArea: [4750, 4797],
  energy: [4801, 4872],
  lafabrik: [4874, 4894],
  directionSecondary: [4896, 4897],
  vegetationSecondary: [4898, 4997],
};

function cloneNode(node) {
  return {
    ...(node.id ? { id: node.id } : {}),
    name: node.name,
    type: node.type,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

function isOriginPosition(position) {
  return position.every((value) => Math.abs(value) < 0.0001);
}

function hasDistinctPylonTransform(node) {
  return (
    node.rotation.some((value) => Math.abs(value) > 0.0001) ||
    node.scale.some((value) => Math.abs(value - 1) > 0.0001)
  );
}

function distanceToPosition(node, position) {
  return Math.hypot(
    node.position[0] - position[0],
    node.position[2] - position[2],
  );
}

function collectMapNodes(root, predicate) {
  const results = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (predicate(node)) {
      results.push(node);
    }
    stack.push(...(node.children ?? []));
  }

  return results;
}

function assignRepairPylonAnchorId(root) {
  const pylones = collectMapNodes(
    root,
    (node) =>
      node.name === "pylone" &&
      node.type === "Object3D" &&
      !isOriginPosition(node.position),
  );
  const distinctPylones = pylones.filter(hasDistinctPylonTransform);
  const candidates = distinctPylones.length > 0 ? distinctPylones : pylones;
  if (candidates.length === 0) return;

  const anchor = [...candidates].sort(
    (a, b) =>
      distanceToPosition(a, REPAIR_PYLON_FALLBACK_POSITION) -
      distanceToPosition(b, REPAIR_PYLON_FALLBACK_POSITION),
  )[0];

  anchor.id = REPAIR_PYLON_ANCHOR_ID;
}

function createGroup(name, sourceNode) {
  return {
    name,
    type: "Object3D",
    role: "group",
    position: sourceNode?.position ?? IDENTITY_NODE.position,
    rotation: sourceNode?.rotation ?? IDENTITY_NODE.rotation,
    scale: sourceNode?.scale ?? IDENTITY_NODE.scale,
    children: [],
  };
}

function mapMeshNode(node) {
  return {
    ...cloneNode(node),
    name: MESH_NAME_MAPPINGS[node.name] ?? node.name,
  };
}

function getOrCreateModelGroup(parent, modelName) {
  let group = parent.children.find(
    (child) => child.name === modelName && child.type === "Object3D",
  );

  if (!group) {
    group = createGroup(modelName);
    parent.children.push(group);
  }

  return group;
}

function getRequiredRawNode(rawData, index, label) {
  const node = rawData[index];
  if (!node) {
    throw new Error(`Missing raw map node for ${label} at index ${index}`);
  }

  return node;
}

function createRenderableObject(objectNode, meshNode) {
  const mappedMesh = mapMeshNode(meshNode);
  const renderableNode = cloneNode(objectNode ?? meshNode);

  if (objectNode && meshNode) {
    const yOffset = Math.abs(objectNode.position[1] - meshNode.position[1]);
    if (yOffset <= MAX_MESH_Y_PLACEMENT_OFFSET) {
      renderableNode.position = [
        objectNode.position[0],
        meshNode.position[1],
        objectNode.position[2],
      ];
    }
  }

  return {
    ...renderableNode,
    name: mappedMesh.name,
    type: "Object3D",
    children: [mappedMesh],
  };
}

function createRenderableContainer(objectNode, meshNodes) {
  return {
    ...cloneNode(objectNode),
    type: "Object3D",
    children: meshNodes.map(mapMeshNode),
  };
}

function addRenderable(parent, objectNode, meshNode) {
  const renderable = createRenderableObject(objectNode, meshNode);
  getOrCreateModelGroup(parent, renderable.name).children.push(renderable);
}

function addStandaloneObject(rawData, parent, name) {
  const node = rawData.find(
    (rawNode) => rawNode?.type === "Object3D" && rawNode.name === name,
  );

  if (!node) return;

  getOrCreateModelGroup(parent, name).children.push(cloneNode(node));
}

function addObjectsByRange(rawData, parent, start, end, allowedNames) {
  let currentObject = null;

  for (let i = start; i <= end; i++) {
    const node = rawData[i];

    if (node?.type === "Object3D") {
      currentObject = node;
      continue;
    }

    if (node?.type !== "Mesh") continue;
    if (allowedNames && !allowedNames.has(node.name)) continue;

    addRenderable(parent, currentObject, node);
  }
}

function addBuildingsByRange(rawData, parent, start, end) {
  for (let i = start; i <= end; i++) {
    const node = rawData[i];
    if (node?.type !== "Object3D" || node.name !== "immeuble1") continue;

    const meshNodes = [];
    for (let childIndex = i + 1; childIndex <= end; childIndex++) {
      const childNode = rawData[childIndex];

      if (childNode?.type === "Object3D") {
        if (BUILDING_CHILD_OBJECT_NAMES.has(childNode.name)) continue;
        break;
      }

      if (
        childNode?.type === "Mesh" &&
        BUILDING_MESH_NAMES.has(childNode.name)
      ) {
        meshNodes.push(childNode);
      }
    }

    if (meshNodes.length > 0) {
      getOrCreateModelGroup(parent, node.name).children.push(
        createRenderableContainer(node, meshNodes),
      );
    }
  }
}

function getNearestGroup(groups, node) {
  const [x, , z] = node.position;

  return groups.reduce((nearest, group) => {
    const [gx, , gz] = group.position;
    const distance = Math.hypot(x - gx, z - gz);
    if (!nearest || distance < nearest.distance) {
      return { group, distance };
    }
    return nearest;
  }, null).group;
}

function createResidenceZones(rawData, residence) {
  const zoneSources = RAW_INDEX.residenceZoneSources.map((index) =>
    getRequiredRawNode(rawData, index, `residence zone ${index}`),
  );
  const zones = zoneSources.map((sourceNode, index) => {
    const zone = createGroup(`zone${index + 1}_residence`, sourceNode);
    residence.children.push(zone);
    return zone;
  });

  addBuildingsByRange(rawData, zones[0], ...RAW_RANGES.residenceZone1);
  addBuildingsByRange(rawData, zones[1], ...RAW_RANGES.residenceZone2);
  addBuildingsByRange(rawData, zones[2], ...RAW_RANGES.residenceZone3);
  addObjectsByRange(
    rawData,
    zones[0],
    ...RAW_RANGES.residenceZone1,
    RESIDENCE_MESH_NAMES,
  );
  addObjectsByRange(
    rawData,
    zones[1],
    ...RAW_RANGES.residenceZone2,
    RESIDENCE_MESH_NAMES,
  );
  addObjectsByRange(
    rawData,
    zones[2],
    ...RAW_RANGES.residenceZone3,
    RESIDENCE_MESH_NAMES,
  );

  for (
    let i = RAW_RANGES.residenceBikes[0];
    i <= RAW_RANGES.residenceBikes[1];
    i++
  ) {
    const node = rawData[i];
    if (node?.type === "Mesh" && node.name === "parcebike") {
      addRenderable(getNearestGroup(zones, node), null, node);
    }
  }

  for (
    let i = RAW_RANGES.residenceMailboxes[0];
    i <= RAW_RANGES.residenceMailboxes[1];
    i++
  ) {
    const node = rawData[i];
    if (node?.type === "Mesh" && node.name === "boitesauxlettres") {
      addRenderable(getNearestGroup(zones, node), null, node);
    }
  }

  return zones;
}

const VEGETATION_MESH_NAMES = new Set(["arbre", "sapin", "buissons"]);
const CHAMP_MESH_NAMES = new Set([
  "champdeble",
  "champdesoja",
  "champsdetournesol",
]);
const FERME_MESH_NAMES = new Set(["buissons", "buisson", "fermeverticale"]);
const RESIDENCE_MESH_NAMES = new Set(["maison1"]);
const BUILDING_CHILD_OBJECT_NAMES = new Set([
  "immeuble",
  "immeuble_1",
  "immeuble_2",
]);
const BUILDING_MESH_NAMES = new Set(["immeuble_1", "immeuble_2"]);
const ENERGIE_MESH_NAMES = new Set([
  "pyloneelectrique",
  "eoliennes",
  "panneausolaire",
  "generateur",
]);
const DIRECTION_MESH_NAMES = new Set([
  "panneauxcentre",
  "panneauxdomaine",
  "panneaudircentre",
  "panneaudirdomaine",
  "panneaudirfabrik",
  "panneaudirresidences1",
  "panneaudirresidences2",
  "panneauxquartier",
]);
const LAFABRIK_MESH_NAMES = new Set(["lafabrik", "maison1"]);
function transformMap() {
  console.log("Reading map_raw.json...");
  const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

  const sceneRaw = rawData.find(
    (node) => node.name === "Scene" && node.type === "Object3D",
  );
  const terrainRaw = rawData.find(
    (node) => node.name === "terrain" && node.type === "Object3D",
  );
  const terrainMesh = rawData.find(
    (node) => node.name === "terrain" && node.type === "Mesh",
  );
  const blockingRaw = rawData.find(
    (node) => node.name === "Neutre" && node.type === "Object3D",
  );

  if (!sceneRaw || !terrainRaw || !terrainMesh || !blockingRaw) {
    throw new Error("Missing required Scene, terrain, or Neutre nodes");
  }

  const scene = createGroup("Scene", sceneRaw);
  const terrain = createGroup("terrain", terrainRaw);
  const blocking = createGroup("blocking", blockingRaw);
  const vegetation = createGroup("vegetation");
  const agriculture = createGroup("agriculture");
  const champs = createGroup("champs");
  const ferme = createGroup(
    "ferme",
    getRequiredRawNode(rawData, RAW_INDEX.fermeGroup, "ferme group"),
  );
  const residence = createGroup("residence");
  const energie = createGroup(
    "energie",
    getRequiredRawNode(rawData, RAW_INDEX.energieGroup, "energie group"),
  );
  const direction = createGroup(
    "direction",
    getRequiredRawNode(rawData, RAW_INDEX.directionGroup, "direction group"),
  );
  const lafabrik = createGroup(
    "lafabrik",
    getRequiredRawNode(rawData, RAW_INDEX.lafabrikGroup, "lafabrik group"),
  );
  const ecole = createGroup(
    "ecole",
    getRequiredRawNode(rawData, RAW_INDEX.ecoleGroup, "ecole group"),
  );
  delete ecole.role;
  const unclassified = createGroup("unclassified");

  terrain.children.push(createRenderableObject(terrainRaw, terrainMesh));
  scene.children.push(terrain, blocking);
  blocking.children.push(
    vegetation,
    agriculture,
    residence,
    energie,
    direction,
    lafabrik,
    ecole,
  );
  agriculture.children.push(champs, ferme);

  addObjectsByRange(
    rawData,
    direction,
    ...RAW_RANGES.directionPrimary,
    DIRECTION_MESH_NAMES,
  );
  addStandaloneObject(rawData, residence, "ebike");
  createResidenceZones(rawData, residence);
  addObjectsByRange(
    rawData,
    energie,
    ...RAW_RANGES.energyPylones,
    new Set(["pyloneelectrique"]),
  );
  addObjectsByRange(
    rawData,
    vegetation,
    ...RAW_RANGES.vegetationPrimary,
    VEGETATION_MESH_NAMES,
  );
  addObjectsByRange(
    rawData,
    agriculture,
    ...RAW_RANGES.lakePipes,
    new Set(["tuyauxlac"]),
  );
  addObjectsByRange(rawData, champs, ...RAW_RANGES.fields, CHAMP_MESH_NAMES);
  addObjectsByRange(rawData, ferme, ...RAW_RANGES.farm, FERME_MESH_NAMES);
  addObjectsByRange(
    rawData,
    vegetation,
    ...RAW_RANGES.vegetationFarmArea,
    VEGETATION_MESH_NAMES,
  );
  addObjectsByRange(rawData, energie, ...RAW_RANGES.energy, ENERGIE_MESH_NAMES);
  addBuildingsByRange(rawData, lafabrik, ...RAW_RANGES.lafabrik);
  addObjectsByRange(
    rawData,
    lafabrik,
    ...RAW_RANGES.lafabrik,
    LAFABRIK_MESH_NAMES,
  );
  addObjectsByRange(
    rawData,
    direction,
    ...RAW_RANGES.directionSecondary,
    DIRECTION_MESH_NAMES,
  );
  addObjectsByRange(
    rawData,
    vegetation,
    ...RAW_RANGES.vegetationSecondary,
    VEGETATION_MESH_NAMES,
  );

  for (let i = 0; i < rawData.length; i++) {
    const node = rawData[i];
    if (node.type !== "Mesh") continue;
    if (node.name === "mc") continue;
    if (node.name === "bati-ecole") continue;

    const alreadyClassified = isMeshClassified(scene, node);
    if (!alreadyClassified) {
      addRenderable(unclassified, null, node);
    }
  }

  if (unclassified.children.length > 0) {
    blocking.children.push(unclassified);
  }

  assignRepairPylonAnchorId(scene);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(scene, null, 2));
  console.log(`Written hierarchical map to ${OUTPUT_PATH}`);
}

function isSameTransform(a, b) {
  return (
    a.name === (MESH_NAME_MAPPINGS[b.name] ?? b.name) &&
    JSON.stringify(a.position) === JSON.stringify(b.position) &&
    JSON.stringify(a.rotation) === JSON.stringify(b.rotation) &&
    JSON.stringify(a.scale) === JSON.stringify(b.scale)
  );
}

function isMeshClassified(root, rawMeshNode) {
  const stack = [...(root.children ?? [])];

  while (stack.length > 0) {
    const node = stack.pop();
    if (node.type === "Mesh" && isSameTransform(node, rawMeshNode)) {
      return true;
    }
    stack.push(...(node.children ?? []));
  }

  return false;
}

transformMap();
