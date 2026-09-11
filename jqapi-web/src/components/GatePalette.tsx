import type { GateTool, Messages } from '../i18n';

export type Tool = GateTool;

export interface GatePaletteProps {
  tool: Tool;
  onSelect: (t: Tool) => void;
  theta: number;
  onChangeTheta: (theta: number) => void;
  messages: Messages;
}

interface ToolInfo {
  tool: Tool;
  icon: string;
  group: 'basic' | 'phase' | 'rotation' | 'multiqubit' | 'utility';
  badgeColor?: string;
}

const TOOL_DEFINITIONS: ToolInfo[] = [
  // Basic
  { tool: 'H', icon: 'H', group: 'basic' },
  { tool: 'X', icon: 'X', group: 'basic' },
  { tool: 'Y', icon: 'Y', group: 'basic' },
  { tool: 'Z', icon: 'Z', group: 'basic' },
  // Phase
  { tool: 'S', icon: 'S', group: 'phase' },
  { tool: 'T', icon: 'T', group: 'phase' },
  // Rotations
  { tool: 'RX', icon: 'Rx', group: 'rotation' },
  { tool: 'RY', icon: 'Ry', group: 'rotation' },
  { tool: 'RZ', icon: 'Rz', group: 'rotation' },
  // Multi-qubit
  { tool: 'CNOT-control', icon: '●', group: 'multiqubit' },
  { tool: 'CNOT-target', icon: '⊕', group: 'multiqubit' },
  { tool: 'CZ-control', icon: '●', group: 'multiqubit' },
  { tool: 'CZ-target', icon: 'Z', group: 'multiqubit' },
  { tool: 'CY-control', icon: '●', group: 'multiqubit' },
  { tool: 'CY-target', icon: 'Y', group: 'multiqubit' },
  { tool: 'SWAP', icon: '✕', group: 'multiqubit' },
  { tool: 'TOFFOLI-control', icon: '●●', group: 'multiqubit' },
  { tool: 'TOFFOLI-target', icon: '⊕', group: 'multiqubit' },
  // Utility
  { tool: 'RESET', icon: '|0⟩', group: 'utility' },
  { tool: 'erase', icon: '⌫', group: 'utility' },
];

const THETA_PRESETS = [
  { label: 'π/4', value: Math.PI / 4 },
  { label: 'π/2', value: Math.PI / 2 },
  { label: 'π', value: Math.PI },
  { label: '3π/2', value: (3 * Math.PI) / 2 },
  { label: '2π', value: 2 * Math.PI },
];

export function GatePalette({ tool, onSelect, theta, onChangeTheta, messages }: GatePaletteProps) {
  const isRotation = tool === 'RX' || tool === 'RY' || tool === 'RZ';

  return (
    <div className="palette-wrapper">
      <div className="palette" role="toolbar" aria-label={messages.gatePalette}>
        {TOOL_DEFINITIONS.map(({ tool: t, icon }) => {
          const label = messages.tools[t];
          const isSelected = t === tool;
          return (
            <button
              key={t}
              type="button"
              data-tool={t}
              className={`gate-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(t)}
              title={`${label} ${messages.gate}`}
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
            <span className="theta-title">{messages.rotationAngle}</span>
            <span className="theta-value">{theta.toFixed(2)} {messages.radians} ({(theta / Math.PI).toFixed(2)}π)</span>
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
