/** Typed entrypoint for the same deterministic JS runtime implementation. */
import type { LabSnapshot, SimulationResult } from './types.ts';
import { simulate as runCore } from './solver-core.js';
export function simulate(snapshot: LabSnapshot): SimulationResult {
  return runCore(snapshot);
}
