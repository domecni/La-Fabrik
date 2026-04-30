import { Html } from "@react-three/drei";
import { useCallback, useState } from "react";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import { REPAIR_GAME_MODEL_CATALOG } from "@/data/gameplay/repairGameModelCatalog";
import type { ModelCatalogItem } from "@/data/gameplay/repairGameModelCatalog";
import { useModelSelection } from "@/hooks/gameplay/useModelSelection";
import type { Vector3Tuple } from "@/types/three/three";

interface RepairModuleSlotProps {
  position: Vector3Tuple;
  label: string;
}

export function RepairModuleSlot({
  position,
  label,
}: RepairModuleSlotProps): React.JSX.Element {
  const [selectedModel, setSelectedModel] = useState<ModelCatalogItem | null>(
    null,
  );
  const [split, setSplit] = useState(false);
  const handleSelect = useCallback((model: ModelCatalogItem) => {
    setSelectedModel(model);
    setSplit(false);
  }, []);
  const selection = useModelSelection(REPAIR_GAME_MODEL_CATALOG, handleSelect);
  const triggerLabel = selectedModel
    ? split
      ? `Réassembler ${label}`
      : `Démonter ${label}`
    : `Choisir ${label}`;

  return (
    <group>
      <TriggerObject
        position={position}
        colliders="cuboid"
        label={triggerLabel}
        onTrigger={() => {
          if (selectedModel) {
            setSplit((value) => !value);
            return;
          }

          selection.open();
        }}
      >
        {selectedModel ? (
          <ExplodableModel
            modelPath={selectedModel.path}
            split={split}
            position={[0, -0.35, 0]}
            scale={0.45}
          />
        ) : (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 0.18, 1]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#082f49"
              roughness={0.55}
            />
          </mesh>
        )}
      </TriggerObject>

      {selection.isOpen ? (
        <Html position={[position[0], position[1] + 1.2, position[2]]} center>
          <div className="model-selector-panel">
            <strong>{label}</strong>
            <span>Fleches: choisir</span>
            <span>E/Enter: valider</span>
            <ul>
              {REPAIR_GAME_MODEL_CATALOG.map((model, index) => (
                <li
                  key={model.path}
                  className={
                    index === selection.selectedIndex
                      ? "is-selected"
                      : undefined
                  }
                >
                  {model.name}
                </li>
              ))}
            </ul>
          </div>
        </Html>
      ) : null}
    </group>
  );
}
