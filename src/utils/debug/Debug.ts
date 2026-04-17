import GUI from "lil-gui";
import type { CameraMode, SceneMode } from "@/types/debug";

export class Debug {
  private static instance: Debug | null = null;

  public readonly active: boolean;
  private readonly gui: GUI | null;
  private readonly folders = new Map<string, GUI>();
  private readonly registeredFolders = new Set<string>();
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
   * Creates a named GUI folder. Returns the folder on first call, null on
   * subsequent calls with the same name — callers should skip `.add()` when
   * null is returned to avoid duplicating controls under StrictMode double-mount.
   */
  createFolder(name: string): GUI | null {
    if (!this.gui) return null;

    if (this.registeredFolders.has(name)) return null;

    this.registeredFolders.add(name);

    const existing = this.folders.get(name);

    if (existing) return existing;

    const folder = this.gui.addFolder(name);
    this.folders.set(name, folder);

    return folder;
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
