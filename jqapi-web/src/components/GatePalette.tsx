import type { DragEvent } from 'react';
import type { Messages } from '../i18n';

export type Tool =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'PHASE' | 'U3'
  | 'CNOT-control' | 'CNOT-target' | 'CZ-control' | 'CZ-target' | 'CY-control' | 'CY-target'
  | 'SWAP' | 'CSWAP-control' | 'CSWAP-swap' | 'TOFFOLI-control' | 'TOFFOLI-target'
  | 'MCX-control' | 'MCX-target' | 'MEASUREMENT' | 'RESET' | 'ORACLE' | 'GENERIC' | 'erase';

type GateGroup = 'single' | 'two' | 'three' | 'multi' | 'other';

const TOOLS: Record<GateGroup, Tool[]> = {
  single: ['H', 'X', 'Y', 'Z', 'S', 'T', 'RX', 'RY', 'RZ', 'PHASE', 'U3', 'MEASUREMENT', 'RESET'],
  two: ['CNOT-control', 'CNOT-target', 'CZ-control', 'CZ-target', 'CY-control', 'CY-target', 'SWAP'],
  three: ['CSWAP-control', 'CSWAP-swap', 'TOFFOLI-control', 'TOFFOLI-target'],
  multi: ['MCX-control', 'MCX-target'],
  other: ['ORACLE', 'GENERIC', 'erase'],
};

const angleTools: Tool[] = ['RX', 'RY', 'RZ', 'PHASE', 'U3'];
const matrixTools: Tool[] = ['ORACLE', 'GENERIC'];

export interface GatePaletteProps {
  tool: Tool;
  messages: Messages;
  onSelect: (tool: Tool) => void;
  theta: number;
  phi: number;
  lambda: number;
  matrixText: string;
  onChangeTheta: (value: number) => void;
  onChangePhi: (value: number) => void;
  onChangeLambda: (value: number) => void;
  onChangeMatrixText: (value: string) => void;
}

export function GatePalette(props: GatePaletteProps) {
  const { tool, messages, onSelect, theta, phi, lambda, matrixText, onChangeTheta, onChangePhi, onChangeLambda, onChangeMatrixText } = props;
  const setDrag = (event: DragEvent<HTMLButtonElement>, selected: Tool) => event.dataTransfer.setData('text/plain', selected);
  const number = (label: string, value: number, onChange: (value: number) => void) => <label className="gate-config-field">{label}<input type="number" step="0.05" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;

  return <div className="palette-wrapper">
    <details className="editor-menu" open>
      <summary>{messages.gates}</summary>
      <div className="palette" role="toolbar" aria-label={messages.gates}>
        {(Object.entries(TOOLS) as [GateGroup, Tool[]][]).map(([group, tools]) => <details className="gate-group" key={group} open={group === 'single'}>
          <summary>{messages.groups[group]}</summary>
          <div className="gate-group-tools">{tools.map((selected) => <button key={selected} type="button" draggable className={`gate-btn ${selected === tool ? 'selected' : ''}`} data-tool={selected}
            onClick={() => onSelect(selected)} onDragStart={(event) => setDrag(event, selected)} title={`Drag or select ${messages.tools[selected]}`}>
            {messages.tools[selected]}
          </button>)}</div>
        </details>)}
      </div>
    </details>
    {angleTools.includes(tool) && <div className="gate-config">{number('θ', theta, onChangeTheta)}{tool === 'U3' && <>{number('φ', phi, onChangePhi)}{number('λ', lambda, onChangeLambda)}</>}</div>}
    {matrixTools.includes(tool) && <label className="matrix-config">2×2 matrix JSON <textarea value={matrixText} onChange={(event) => onChangeMatrixText(event.target.value)} spellCheck={false} /></label>}
  </div>;
}
