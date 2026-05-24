import GUI from "lil-gui";
import type { CameraMode, SceneMode } from "@/types/debug/debug";
import type { HandTrackingSource } from "@/types/handTracking/handTracking";
import { FOG_CONFIG } from "@/data/world/fogConfig";
import { EventEmitter } from "@/utils/core/EventEmitter";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

const DEBUG_CONTROLS_STORAGE_KEY = "la-fabrik-debug-controls";

interface StoredDebugControls {
  cameraMode: CameraMode;
  sceneMode: SceneMode;
}

interface DebugEvents {
  change: void;
}

const DEBUG_FOLDER_ORDER = [
  "Lighting",
  "Game",
  "Interaction",
  "Hand Tracking",
  "Map",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCameraMode(value: unknown): value is CameraMode {
  return value === "player" || value === "debug";
}

function isSceneMode(value: unknown): value is SceneMode {
  return value === "game" || value === "physics";
}

function getStoredDebugControls(): Partial<StoredDebugControls> {
  try {
    const rawValue = window.localStorage.getItem(DEBUG_CONTROLS_STORAGE_KEY);
    if (!rawValue) return {};

    const parsedValue: unknown = JSON.parse(rawValue);
    if (!isRecord(parsedValue)) return {};

    return {
      ...(isCameraMode(parsedValue.cameraMode)
        ? { cameraMode: parsedValue.cameraMode }
        : {}),
      ...(isSceneMode(parsedValue.sceneMode)
        ? { sceneMode: parsedValue.sceneMode }
        : {}),
    };
  } catch {
    return {};
  }
}

export class Debug {
  private static instance: Debug | null = null;

  public readonly active: boolean;
  private readonly gui: GUI | null;
  private readonly events = new EventEmitter<DebugEvents>();
  private readonly folders = new Map<string, GUI>();
  private readonly folderRefCounts = new Map<string, number>();
  private readonly controls: {
    cameraMode: CameraMode;
    fogEnabled: boolean;
    handTrackingSource: HandTrackingSource;
    showDebugOverlay: boolean;
    showHandTrackingSvg: boolean;
    showInteractionSpheres: boolean;
    showPerf: boolean;
    sceneMode: SceneMode;
  };

  static getInstance(): Debug {
    if (!Debug.instance) {
      Debug.instance = new Debug();
    }

    return Debug.instance;
  }

  private constructor() {
    this.active = isDebugEnabled();
    const storedControls = getStoredDebugControls();

    this.controls = {
      cameraMode: storedControls.cameraMode ?? "player",
      fogEnabled: FOG_CONFIG.enabled,
      handTrackingSource: "browser",
      showDebugOverlay: true,
      showHandTrackingSvg: false,
      showInteractionSpheres: false,
      showPerf: true,
      sceneMode: storedControls.sceneMode ?? "game",
    };

    this.gui = this.active ? new GUI({ title: "La Fabrik" }) : null;

    if (this.gui) {
      this.gui.open();

      this.gui
        .add(this.controls, "cameraMode", { Player: "player", Debug: "debug" })
        .name("Camera Mode")
        .onChange((value: CameraMode) => {
          this.controls.cameraMode = value;
          this.saveAndEmit();
        });

      this.gui
        .add(this.controls, "sceneMode", { Game: "game", Physics: "physics" })
        .name("Scene")
        .onChange((value: SceneMode) => {
          this.controls.sceneMode = value;
          this.saveAndEmit();
        });

      this.gui
        .add(this.controls, "showPerf")
        .name("R3F Perf")
        .onChange((value: boolean) => {
          this.controls.showPerf = value;
          this.emit();
        });

      this.gui
        .add(this.controls, "showDebugOverlay")
        .name("Debug Overlay")
        .onChange((value: boolean) => {
          this.controls.showDebugOverlay = value;
          this.emit();
        });

      this.createOrderedFolders();

      const handTrackingFolder = this.createFolder("Hand Tracking");

      handTrackingFolder
        ?.add(this.controls, "showHandTrackingSvg")
        .name("Show SVG")
        .onChange((value: boolean) => {
          this.controls.showHandTrackingSvg = value;
          this.emit();
        });

      handTrackingFolder
        ?.add(this.controls, "handTrackingSource", {
          "Browser JS": "browser",
          Backend: "backend",
        })
        .name("Source")
        .onChange((value: HandTrackingSource) => {
          this.controls.handTrackingSource = value;
          this.emit();
        });
    }
  }

  /**
   * Acquires a named GUI folder. Returns the folder on first acquisition and null
   * on subsequent acquisitions so callers only register controls once.
   */
  createFolder(name: string, options?: { open?: boolean }): GUI | null {
    if (!this.gui) return null;

    const existing = this.folders.get(name);

    if (existing) {
      const refCount = this.folderRefCounts.get(name) ?? 0;

      if (refCount > 0) {
        this.folderRefCounts.set(name, refCount + 1);
        return null;
      }

      this.folderRefCounts.set(name, 1);
      return existing;
    }

    const folder = this.gui.addFolder(name);
    this.folders.set(name, folder);
    this.folderRefCounts.set(name, 1);
    this.sortFolders();

    if (options?.open) {
      folder.open();
    } else {
      folder.close();
    }

    return folder;
  }

  addFogControl(folder: GUI): void {
    folder
      .add(this.controls, "fogEnabled")
      .name("Fog")
      .onChange((value: boolean) => {
        this.controls.fogEnabled = value;
        this.emit();
      });
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
    return this.events.on("change", listener);
  }

  getCameraMode(): CameraMode {
    return this.controls.cameraMode;
  }

  getSceneMode(): SceneMode {
    return this.controls.sceneMode;
  }

  getShowDebugOverlay(): boolean {
    return this.active && this.controls.showDebugOverlay;
  }

  getHandTrackingSource(): HandTrackingSource {
    return this.controls.handTrackingSource;
  }

  getFogEnabled(): boolean {
    return this.controls.fogEnabled;
  }

  getShowInteractionSpheres(): boolean {
    return this.controls.showInteractionSpheres;
  }

  getShowHandTrackingSvg(): boolean {
    return this.controls.showHandTrackingSvg;
  }

  setShowHandTrackingSvg(value: boolean): void {
    this.controls.showHandTrackingSvg = value;
    this.emit();
  }

  setShowInteractionSpheres(value: boolean): void {
    this.controls.showInteractionSpheres = value;
    this.emit();
  }

  getShowPerf(): boolean {
    return this.active && this.controls.showPerf;
  }

  private emit(): void {
    this.events.emit("change", undefined);
  }

  private saveAndEmit(): void {
    try {
      window.localStorage.setItem(
        DEBUG_CONTROLS_STORAGE_KEY,
        JSON.stringify({
          cameraMode: this.controls.cameraMode,
          sceneMode: this.controls.sceneMode,
        }),
      );
    } catch {
      // Debug persistence is optional; controls still work if storage is blocked.
    }

    this.emit();
  }

  private createOrderedFolders(): void {
    for (const folderName of DEBUG_FOLDER_ORDER) {
      this.ensureFolder(folderName);
    }
  }

  private ensureFolder(name: string): GUI | null {
    if (!this.gui) return null;

    const existing = this.folders.get(name);
    if (existing) return existing;

    const folder = this.gui.addFolder(name);
    folder.close();
    this.folders.set(name, folder);
    this.folderRefCounts.set(name, 0);
    this.sortFolders();

    return folder;
  }

  private sortFolders(): void {
    if (!this.gui) return;

    const rootElement = this.gui.domElement.querySelector(".children");
    if (!rootElement) return;

    const orderedFolders = [...this.folders.entries()].sort(([a], [b]) => {
      const aIndex = DEBUG_FOLDER_ORDER.indexOf(
        a as (typeof DEBUG_FOLDER_ORDER)[number],
      );
      const bIndex = DEBUG_FOLDER_ORDER.indexOf(
        b as (typeof DEBUG_FOLDER_ORDER)[number],
      );
      const safeAIndex = aIndex === -1 ? DEBUG_FOLDER_ORDER.length : aIndex;
      const safeBIndex = bIndex === -1 ? DEBUG_FOLDER_ORDER.length : bIndex;

      if (safeAIndex !== safeBIndex) return safeAIndex - safeBIndex;
      return a.localeCompare(b);
    });

    for (const [, folder] of orderedFolders) {
      rootElement.appendChild(folder.domElement);
    }
  }
}
