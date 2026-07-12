export type Tool = 'H' | 'X' | 'Z' | 'CNOT-control' | 'CNOT-target' | 'erase';

const TOOLS: Tool[] = ['H', 'X', 'Z', 'CNOT-control', 'CNOT-target', 'erase'];

function labelFor(t: Tool): string {
  if (t === 'CNOT-control') return '● CNOT ctrl';
  if (t === 'CNOT-target') return '⊕ CNOT tgt';
  if (t === 'erase') return '⌫ erase';
  return t;
}

/** Palette of the MVP gate set; selecting a tool sets the click-to-place brush. */
export function GatePalette({ tool, onSelect }: { tool: Tool; onSelect: (t: Tool) => void }) {
  return (
    <div className="palette">
      {TOOLS.map((t) => (
        <button key={t} className={t === tool ? 'selected' : ''} onClick={() => onSelect(t)}>
          {labelFor(t)}
        </button>
      ))}
    </div>
  );
}
