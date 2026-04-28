export type InteractableKind = "grab" | "trigger";

interface TriggerInteractableHandle {
  kind: "trigger";
  label: string;
  onPress: () => void;
}

export interface GrabInteractableHandle {
  kind: "grab";
  label: string;
  onPress: () => void;
  onRelease: () => void;
}

export type InteractableHandle =
  | TriggerInteractableHandle
  | GrabInteractableHandle;

export interface InteractionSnapshot {
  focused: InteractableHandle | null;
  holding: boolean;
}
