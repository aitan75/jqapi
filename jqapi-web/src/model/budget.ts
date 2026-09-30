import { BROWSER_BUDGET } from '../wasm/policy';
import type { CircuitSpec, Observable } from '../wasm/types';

/** Work-only admission hints for a validated editor spec. Other bridge guards still apply. */
export function shotBudgets(spec: CircuitSpec, observable: Observable | null) {
  const passes = 1 + spec.levels.reduce((sum, level) => sum + level.gates.reduce(
    (total, gate) => total + (gate.matrix?.length ?? Math.max(1, gate.targets.length)), 0), 0);
  const states = 2 ** spec.numQubits;
  const limit = (visits: number) => visits === 0 ? BROWSER_BUDGET.maxShots
    : Math.min(BROWSER_BUDGET.maxShots, Math.floor(BROWSER_BUDGET.maxWork / visits));
  const nonIdentityTerms = observable?.terms.filter((term) => /[XYZ]/.test(term.pauli)).length ?? 0;
  return {
    counts: limit(states * passes),
    observable: observable ? limit(states * (passes + 2 * spec.numQubits) * nonIdentityTerms) : null,
  };
}
