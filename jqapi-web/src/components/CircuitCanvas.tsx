import type { ReactNode } from 'react';
import { Stage, Layer, Line, Rect, Text, Circle } from 'react-konva';
import { COLUMNS, type CircuitModel } from '../model/circuit';

const CELL = 56;
const LABEL_W = 48;

/**
 * Renders the circuit grid: one wire per qubit, {@link COLUMNS} step cells each.
 * Clicking a cell invokes {@code onCellClick}; the parent owns the model and
 * bumps {@code version} to force a redraw.
 */
export function CircuitCanvas({
  model,
  onCellClick,
  version,
}: {
  model: CircuitModel;
  onCellClick: (qubit: number, step: number) => void;
  version: number;
}) {
  const width = LABEL_W + COLUMNS * CELL;
  const height = model.numQubits * CELL;
  const nodes: ReactNode[] = [];

  for (let q = 0; q < model.numQubits; q++) {
    const y = q * CELL + CELL / 2;
    nodes.push(<Line key={`w${q}`} points={[LABEL_W, y, width, y]} stroke="#888" />);
    nodes.push(<Text key={`l${q}`} x={4} y={y - 8} text={`q${q}`} />);
    for (let s = 0; s < COLUMNS; s++) {
      const x = LABEL_W + s * CELL + CELL / 2;
      const click = () => onCellClick(q, s);
      nodes.push(
        <Rect
          key={`c${q}-${s}`}
          x={x - CELL / 2 + 4}
          y={q * CELL + 4}
          width={CELL - 8}
          height={CELL - 8}
          stroke="#ddd"
          onClick={click}
          onTap={click}
        />,
      );
      const c = model.cellAt(q, s);
      if (c && c.kind !== 'CNOT') {
        nodes.push(
          <Rect key={`g${q}-${s}`} x={x - 16} y={y - 16} width={32} height={32} fill="#e8f0ff" stroke="#3366cc" onClick={click} onTap={click} />,
        );
        nodes.push(<Text key={`t${q}-${s}`} x={x - 6} y={y - 8} text={c.kind} onClick={click} onTap={click} />);
      } else if (c && c.kind === 'CNOT') {
        nodes.push(
          c.role === 'control' ? (
            <Circle key={`cc${q}-${s}`} x={x} y={y} radius={7} fill="#000" onClick={click} onTap={click} />
          ) : (
            <Circle key={`ct${q}-${s}`} x={x} y={y} radius={12} stroke="#000" onClick={click} onTap={click} />
          ),
        );
      }
    }
  }

  // Vertical CNOT connector per column that has both endpoints.
  for (let s = 0; s < COLUMNS; s++) {
    let cy = -1;
    let ty = -1;
    for (let q = 0; q < model.numQubits; q++) {
      const c = model.cellAt(q, s);
      if (c && c.kind === 'CNOT') {
        if (c.role === 'control') cy = q;
        else ty = q;
      }
    }
    if (cy >= 0 && ty >= 0) {
      const x = LABEL_W + s * CELL + CELL / 2;
      nodes.push(<Line key={`cx${s}`} points={[x, cy * CELL + CELL / 2, x, ty * CELL + CELL / 2]} stroke="#000" />);
    }
  }

  return (
    <Stage width={width} height={height} key={version}>
      <Layer>{nodes}</Layer>
    </Stage>
  );
}
