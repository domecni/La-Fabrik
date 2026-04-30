import { Text } from "@react-three/drei";
import { RepairCaseObject } from "@/components/three/gameplay/RepairCaseObject";
import { RepairModuleSlot } from "@/components/three/gameplay/RepairModuleSlot";
import {
  REPAIR_GAME_MODULE_SLOTS,
  REPAIR_GAME_ZONE_LABEL,
  REPAIR_GAME_ZONE_ORIGIN,
  REPAIR_GAME_ZONE_RADIUS,
} from "@/data/gameplay/repairGameConfig";
import { useGameStore } from "@/managers/stores/useGameStore";

const CASE_CLOSED_STEPS = new Set(["locked", "waiting"]);

export function RepairGameZone(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);
  const bikeStep = useGameStore((state) => state.bike.currentStep);
  const setMainState = useGameStore((state) => state.setMainState);
  const setBikeState = useGameStore((state) => state.setBikeState);
  const caseOpen = !CASE_CLOSED_STEPS.has(bikeStep);
  const slotsDisabled = !caseOpen;

  const inspectRepairCase = (): void => {
    if (mainState !== "bike") {
      setMainState("bike");
    }

    if (CASE_CLOSED_STEPS.has(bikeStep)) {
      setBikeState({ currentStep: "inspected" });
    }
  };

  const markModelSelected = (): void => {
    if (mainState !== "bike") {
      setMainState("bike");
    }

    if (bikeStep === "inspected") {
      setBikeState({ currentStep: "fragmented" });
    }
  };

  const markModuleSplit = (): void => {
    if (mainState !== "bike") {
      setMainState("bike");
    }

    if (bikeStep === "fragmented") {
      setBikeState({ currentStep: "scanning" });
    }
  };

  return (
    <group>
      <mesh
        position={[
          REPAIR_GAME_ZONE_ORIGIN[0],
          0.025,
          REPAIR_GAME_ZONE_ORIGIN[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[REPAIR_GAME_ZONE_RADIUS - 0.08, REPAIR_GAME_ZONE_RADIUS, 96]}
        />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.72} />
      </mesh>

      <mesh
        position={[
          REPAIR_GAME_ZONE_ORIGIN[0],
          0.02,
          REPAIR_GAME_ZONE_ORIGIN[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[REPAIR_GAME_ZONE_RADIUS, 96]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} />
      </mesh>

      <Text
        position={[
          REPAIR_GAME_ZONE_ORIGIN[0],
          3.1,
          REPAIR_GAME_ZONE_ORIGIN[2] - 1.8,
        ]}
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
        {REPAIR_GAME_ZONE_LABEL}
      </Text>

      <RepairCaseObject
        position={REPAIR_GAME_ZONE_ORIGIN}
        open={caseOpen}
        onInspect={inspectRepairCase}
      />

      {REPAIR_GAME_MODULE_SLOTS.map((slot) => (
        <RepairModuleSlot
          key={slot.label}
          label={slot.label}
          position={[
            REPAIR_GAME_ZONE_ORIGIN[0] + slot.offset[0],
            REPAIR_GAME_ZONE_ORIGIN[1] + slot.offset[1],
            REPAIR_GAME_ZONE_ORIGIN[2] + slot.offset[2],
          ]}
          disabled={slotsDisabled}
          onModelSelected={markModelSelected}
          onSplit={markModuleSplit}
        />
      ))}
    </group>
  );
}
