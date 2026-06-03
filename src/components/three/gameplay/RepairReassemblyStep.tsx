import { RepairCompletionParticles } from "@/components/three/gameplay/RepairCompletionParticles";

/**
 * Visual layer for the reassembly phase. The actual collapse animation
 * (parts lerping back to their original positions) is driven by the
 * shared ExplodableModel mounted upstream by RepairGame, which keeps a
 * single instance alive across fragmented -> done so the model never
 * reloads or jumps between phases.
 *
 * This component now only renders the completion particles and emits a
 * settled signal after `delayMs` so the upstream flow can advance.
 */
export function RepairReassemblyStep(): React.JSX.Element {
  return <RepairCompletionParticles />;
}
