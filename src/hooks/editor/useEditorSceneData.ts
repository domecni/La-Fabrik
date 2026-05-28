import { useCallback, useEffect, useState } from "react";
import { createSceneDataFromFiles } from "@/utils/editor/loadEditorScene";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";
import type { SceneData } from "@/types/map/mapScene";

interface UseEditorSceneDataResult {
  hasMapJson: boolean;
  isMapLoading: boolean;
  sceneData: SceneData | null;
  setSceneData: React.Dispatch<React.SetStateAction<SceneData | null>>;
  handleFolderUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
}

export function useEditorSceneData(): UseEditorSceneDataResult {
  const [hasMapJson, setHasMapJson] = useState<boolean>(false);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [sceneData, setSceneData] = useState<SceneData | null>(null);

  useEffect(() => {
    const loadScene = async (): Promise<void> => {
      setIsMapLoading(true);

      try {
        const loadedSceneData = await loadMapSceneData();
        setSceneData(loadedSceneData);
        setHasMapJson(Boolean(loadedSceneData));
      } catch (error) {
        console.error("Error loading map data:", error);
        setHasMapJson(false);
      } finally {
        setIsMapLoading(false);
      }
    };

    loadScene();
  }, []);

  const handleFolderUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files) return;

      try {
        const uploadedSceneData = await createSceneDataFromFiles(files);
        setSceneData(uploadedSceneData);
        setHasMapJson(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur";
        console.error("Error processing upload:", error);
        alert(message);
      }
    },
    [],
  );

  return {
    hasMapJson,
    isMapLoading,
    sceneData,
    setSceneData,
    handleFolderUpload,
  };
}
