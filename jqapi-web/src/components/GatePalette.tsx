export type Tool =
  | 'H'
  | 'X'
  | 'Y'
  | 'Z'
  | 'S'
  | 'T'
  | 'RX'
  | 'RY'
  | 'RZ'
  | 'CNOT-control'
  | 'CNOT-target'
  | 'CZ-control'
  | 'CZ-target'
  | 'CY-control'
  | 'CY-target'
  | 'SWAP'
  | 'TOFFOLI-control'
  | 'TOFFOLI-target'
  | 'RESET'
  | 'erase';

export interface GatePaletteProps {
  tool: Tool;
  onSelect: (t: Tool) => void;
  theta: number;
  onChangeTheta: (theta: number) => void;
}

interface ToolInfo {
  tool: Tool;
  icon: string;
  label: string;
  group: 'basic' | 'phase' | 'rotation' | 'multiqubit' | 'utility';
  badgeColor?: string;
}

const TOOL_DEFINITIONS: ToolInfo[] = [
  // Basic
  { tool: 'H', icon: 'H', label: 'H', group: 'basic' },
  { tool: 'X', icon: 'X', label: 'X', group: 'basic' },
  { tool: 'Y', icon: 'Y', label: 'Y', group: 'basic' },
  { tool: 'Z', icon: 'Z', label: 'Z', group: 'basic' },
  // Phase
  { tool: 'S', icon: 'S', label: 'S (π/2)', group: 'phase' },
  { tool: 'T', icon: 'T', label: 'T (π/4)', group: 'phase' },
  // Rotations
  { tool: 'RX', icon: 'Rx', label: 'Rx(θ)', group: 'rotation' },
  { tool: 'RY', icon: 'Ry', label: 'Ry(θ)', group: 'rotation' },
  { tool: 'RZ', icon: 'Rz', label: 'Rz(θ)', group: 'rotation' },
  // Multi-qubit
  { tool: 'CNOT-control', icon: '●', label: 'CNOT ctrl', group: 'multiqubit' },
  { tool: 'CNOT-target', icon: '⊕', label: 'CNOT tgt', group: 'multiqubit' },
  { tool: 'CZ-control', icon: '●', label: 'CZ ctrl', group: 'multiqubit' },
  { tool: 'CZ-target', icon: 'Z', label: 'CZ tgt', group: 'multiqubit' },
  { tool: 'CY-control', icon: '●', label: 'CY ctrl', group: 'multiqubit' },
  { tool: 'CY-target', icon: 'Y', label: 'CY tgt', group: 'multiqubit' },
  { tool: 'SWAP', icon: '✕', label: 'SWAP', group: 'multiqubit' },
  { tool: 'TOFFOLI-control', icon: '●●', label: 'Toffoli ctrl', group: 'multiqubit' },
  { tool: 'TOFFOLI-target', icon: '⊕', label: 'Toffoli tgt', group: 'multiqubit' },
  // Utility
  { tool: 'RESET', icon: '|0⟩', label: 'Reset', group: 'utility' },
  { tool: 'erase', icon: '⌫', label: 'Erase', group: 'utility' },
];

const THETA_PRESETS = [
  { label: 'π/4', value: Math.PI / 4 },
  { label: 'π/2', value: Math.PI / 2 },
  { label: 'π', value: Math.PI },
  { label: '3π/2', value: (3 * Math.PI) / 2 },
  { label: '2π', value: 2 * Math.PI },
];

export function GatePalette({ tool, onSelect, theta, onChangeTheta }: GatePaletteProps) {
  const isRotation = tool === 'RX' || tool === 'RY' || tool === 'RZ';

  return (
    <div className="palette-wrapper">
      <div className="palette" role="toolbar" aria-label="Expanded Quantum Gates Palette">
        {TOOL_DEFINITIONS.map(({ tool: t, icon, label }) => {
          const isSelected = t === tool;
          return (
            <button
              key={t}
              type="button"
              data-tool={t}
              className={`gate-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(t)}
              title={`${label} gate`}
            >
              <span className="gate-icon">{icon}</span>
              <span className="gate-label">{label}</span>
            </button>
          );
        })}
      </div>

      {isRotation && (
        <div className="theta-control-panel">
          <div className="theta-header">
            <span className="theta-title">Rotation Angle (θ):</span>
            <span className="theta-value">{theta.toFixed(2)} rad ({(theta / Math.PI).toFixed(2)}π)</span>
          </div>

          <div className="theta-presets">
            {THETA_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`theta-chip ${Math.abs(theta - p.value) < 0.01 ? 'active' : ''}`}
                onClick={() => onChangeTheta(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="theta-slider-row">
            <input
              type="range"
              min={0}
              max={2 * Math.PI}
              step={0.05}
              value={theta}
              onChange={(e) => onChangeTheta(parseFloat(e.target.value))}
              className="theta-slider"
            />
          </div>
        </div>
      )}
    </div>
  );
}
