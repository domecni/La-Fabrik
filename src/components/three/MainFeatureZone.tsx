import { useState } from "react";
import { Text } from "@react-three/drei";
import { TriggerObject } from "@/components/three/TriggerObject";
import { ModelSelectorPlaceholder } from "@/components/three/ModelSelectorPlaceholder";
import { RepairCaseModel } from "@/components/three/RepairCaseModel";

const ZONE_ORIGIN = [10, 0.4, -8] as const;
const CASE_MODEL_PATH = "/models/packderelance/model.gltf";
const ZONE_RADIUS = 4.2;

export function MainFeatureZone(): React.JSX.Element {
  const [caseOpen, setCaseOpen] = useState(false);

  return (
    <group>
      <mesh
        position={[ZONE_ORIGIN[0], 0.025, ZONE_ORIGIN[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[ZONE_RADIUS - 0.08, ZONE_RADIUS, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.72} />
      </mesh>

      <mesh
        position={[ZONE_ORIGIN[0], 0.02, ZONE_ORIGIN[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[ZONE_RADIUS, 96]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} />
      </mesh>

      <Text
        position={[ZONE_ORIGIN[0], 3.1, ZONE_ORIGIN[2] - 1.8]}
        rotation={[0, 0, 0]}
        fontSize={0.55}
        maxWidth={5.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#f8fafc"
        outlineWidth={0.025}
        outlineColor="#0f172a"
      >
        Pack de Relance Feature
      </Text>

      <TriggerObject
        position={[ZONE_ORIGIN[0], ZONE_ORIGIN[1], ZONE_ORIGIN[2]]}
        colliders="cuboid"
        label={caseOpen ? "Fermer la mallette" : "Ouvrir la mallette"}
        onTrigger={() => setCaseOpen((value) => !value)}
      >
        <RepairCaseModel
          modelPath={CASE_MODEL_PATH}
          open={caseOpen}
          position={[0, -0.45, 0]}
          scale={0.35}
        />
      </TriggerObject>

      <ModelSelectorPlaceholder
        label="Module A"
        position={[ZONE_ORIGIN[0] - 2.2, ZONE_ORIGIN[1], ZONE_ORIGIN[2] + 2.2]}
      />
      <ModelSelectorPlaceholder
        label="Module B"
        position={[ZONE_ORIGIN[0], ZONE_ORIGIN[1], ZONE_ORIGIN[2] + 2.6]}
      />
      <ModelSelectorPlaceholder
        label="Module C"
        position={[ZONE_ORIGIN[0] + 2.2, ZONE_ORIGIN[1], ZONE_ORIGIN[2] + 2.2]}
      />
    </group>
  );
}
