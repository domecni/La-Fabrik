import { createContext } from "react";

export interface AnimatedModelContextValue {
  play: (name: string, fade?: number) => void;
  stop: (fade?: number) => void;
  fadeTo: (name: string, fade?: number) => void;
  currentAnimation: string;
  isReady: boolean;
  setSpeed: (speed: number) => void;
  names: string[];
}

export const AnimatedModelContext =
  createContext<AnimatedModelContextValue | null>(null);
