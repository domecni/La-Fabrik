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
  panneauxquartier: "panneauaffichage",
};

const IDENTITY_NODE = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};
const MAX_MESH_Y_PLACEMENT_OFFSET = 2;

function cloneNode(node) {
  return {
    name: node.name,
    type: node.type,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
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
  const zoneSources = [rawData[830], rawData[874], rawData[892]];
  const zones = zoneSources.map((sourceNode, index) => {
    const zone = createGroup(`zone${index + 1}_residence`, sourceNode);
    residence.children.push(zone);
    return zone;
  });

  addBuildingsByRange(rawData, zones[0], 831, 873);
  addBuildingsByRange(rawData, zones[1], 875, 891);
  addBuildingsByRange(rawData, zones[2], 893, 942);
  addObjectsByRange(rawData, zones[0], 831, 873, RESIDENCE_MESH_NAMES);
  addObjectsByRange(rawData, zones[1], 875, 891, RESIDENCE_MESH_NAMES);
  addObjectsByRange(rawData, zones[2], 893, 942, RESIDENCE_MESH_NAMES);

  for (let i = 14; i <= 23; i++) {
    const node = rawData[i];
    if (node?.type === "Mesh" && node.name === "parcebike") {
      addRenderable(getNearestGroup(zones, node), null, node);
    }
  }

  for (let i = 25; i <= 58; i++) {
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
  const ferme = createGroup("ferme", rawData[4798]);
  const residence = createGroup("residence");
  const energie = createGroup("energie", rawData[4800]);
  const direction = createGroup("direction", rawData[5]);
  const lafabrik = createGroup("lafabrik", rawData[4873]);
  const ecole = createGroup("ecole", rawData[4895]);
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

  addObjectsByRange(rawData, direction, 6, 12, DIRECTION_MESH_NAMES);
  createResidenceZones(rawData, residence);
  addObjectsByRange(rawData, energie, 61, 96, new Set(["pyloneelectrique"]));
  addObjectsByRange(rawData, vegetation, 98, 829, VEGETATION_MESH_NAMES);
  addObjectsByRange(rawData, agriculture, 944, 944, new Set(["tuyauxlac"]));
  addObjectsByRange(rawData, champs, 946, 4594, CHAMP_MESH_NAMES);
  addObjectsByRange(rawData, ferme, 4595, 4799, FERME_MESH_NAMES);
  addObjectsByRange(rawData, vegetation, 4750, 4797, VEGETATION_MESH_NAMES);
  addObjectsByRange(rawData, energie, 4801, 4872, ENERGIE_MESH_NAMES);
  addBuildingsByRange(rawData, lafabrik, 4874, 4894);
  addObjectsByRange(rawData, lafabrik, 4874, 4894, LAFABRIK_MESH_NAMES);
  addObjectsByRange(rawData, direction, 4896, 4897, DIRECTION_MESH_NAMES);
  addObjectsByRange(rawData, vegetation, 4898, 4997, VEGETATION_MESH_NAMES);

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
