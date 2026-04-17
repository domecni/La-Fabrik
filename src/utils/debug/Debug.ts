import GUI from "lil-gui";
import type { CameraMode, SceneMode } from "@/types/debug";

export class Debug {
  private static instance: Debug | null = null;

  public readonly active: boolean;
  private readonly gui: GUI | null;
  private readonly folders = new Map<string, GUI>();
  private readonly folderRefCounts = new Map<string, number>();
  private readonly listeners = new Set<() => void>();
  private readonly controls: {
    cameraMode: CameraMode;
    showInteractionSpheres: boolean;
    sceneMode: SceneMode;
  } = {
    cameraMode: "player",
    showInteractionSpheres: false,
    sceneMode: "game",
  };

  static getInstance(): Debug {
    if (!Debug.instance) {
      Debug.instance = new Debug();
    }

    return Debug.instance;
  }

  private constructor() {
    this.active = new URLSearchParams(window.location.search).has("debug");
    this.gui = this.active ? new GUI({ title: "La-Fabrik Debug" }) : null;

    if (this.gui) {
      const folder = this.createFolder("Debug");

      if (!folder) return;

      folder
        .add(this.controls, "cameraMode", { Player: "player", Debug: "debug" })
        .name("Camera Mode")
        .onChange((value: CameraMode) => {
          this.controls.cameraMode = value;
          this.emit();
        });

      folder
        .add(this.controls, "sceneMode", { Game: "game", Physics: "physics" })
        .name("Scene")
        .onChange((value: SceneMode) => {
          this.controls.sceneMode = value;
          this.emit();
        });

      folder
        .add(this.controls, "showInteractionSpheres")
        .name("Interaction Spheres")
        .onChange((value: boolean) => {
          this.controls.showInteractionSpheres = value;
          this.emit();
        });
    }
  }

  /**
   * Acquires a named GUI folder. Returns the folder on first acquisition and null
   * on subsequent acquisitions so callers only register controls once.
   */
  createFolder(name: string): GUI | null {
    if (!this.gui) return null;

    const existing = this.folders.get(name);

    if (existing) {
      this.folderRefCounts.set(name, (this.folderRefCounts.get(name) ?? 0) + 1);
      return null;
    }

    const folder = this.gui.addFolder(name);
    this.folders.set(name, folder);
    this.folderRefCounts.set(name, 1);

    return folder;
  }

  destroyFolder(name: string): void {
    const folder = this.folders.get(name);
    const refCount = this.folderRefCounts.get(name);
    if (!folder || refCount === undefined) return;

    if (refCount > 1) {
      this.folderRefCounts.set(name, refCount - 1);
      return;
    }

    folder.destroy();
    this.folders.delete(name);
    this.folderRefCounts.delete(name);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getCameraMode(): CameraMode {
    return this.controls.cameraMode;
  }

  getSceneMode(): SceneMode {
    return this.controls.sceneMode;
  }

  getShowInteractionSpheres(): boolean {
    return this.controls.showInteractionSpheres;
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
