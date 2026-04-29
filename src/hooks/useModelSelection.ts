import { useCallback, useEffect, useState } from "react";
import type { ModelCatalogItem } from "@/data/mainFeature/modelCatalog";

interface UseModelSelectionResult {
  isOpen: boolean;
  selectedIndex: number;
  selectedModel: ModelCatalogItem;
  open: () => void;
  close: () => void;
}

export function useModelSelection(
  models: ModelCatalogItem[],
  onSelect: (model: ModelCatalogItem) => void,
): UseModelSelectionResult {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();

      if (["arrowup", "arrowleft"].includes(key)) {
        setSelectedIndex((index) =>
          index === 0 ? models.length - 1 : index - 1,
        );
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (["arrowdown", "arrowright"].includes(key)) {
        setSelectedIndex((index) => (index + 1) % models.length);
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (key === "e" || key === "enter") {
        onSelect(models[selectedIndex]);
        close();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (key === "escape") {
        close();
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [close, isOpen, models, onSelect, selectedIndex]);

  return {
    isOpen,
    selectedIndex,
    selectedModel: models[selectedIndex],
    open,
    close,
  };
}
