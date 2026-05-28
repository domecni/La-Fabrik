import type { WindState } from "@/data/world/windConfig";

export function getWindVector(wind: WindState): { x: number; z: number } {
  const intensity = wind.speed * wind.strength;

  return {
    x: Math.cos(wind.direction) * intensity,
    z: Math.sin(wind.direction) * intensity,
  };
}
