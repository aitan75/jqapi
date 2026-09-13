import { MAX_QUBITS } from '../model/circuit';
import type { Messages } from '../i18n';

/** Number input for the qubit count, clamped to 1..MAX_QUBITS. */
export function QubitSelector({ value, onChange, messages }: { value: number; onChange: (n: number) => void; messages: Messages }) {
  return (
    <label className="qubits">
      {messages.qubits}{' '}
      <input
        type="number"
        min={1}
        max={MAX_QUBITS}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(MAX_QUBITS, Number(e.target.value) || 1)))}
      />
    </label>
  );
}
