import type { ReactNode } from 'react';
import { Stage, Layer, Line, Rect, Text, Circle, Group } from 'react-konva';
import { COLUMNS, type CircuitModel } from '../model/circuit';

const CELL = 60;
const LABEL_W = 56;
const GATE_SIZE = 38;

interface GateTheme {
  fill: string;
  stroke: string;
  shadow: string;
  textColor: string;
}

const GATE_THEMES: Record<string, GateTheme> = {
  H: { fill: '#082333', stroke: '#00f0ff', shadow: '#00f0ff', textColor: '#e0faff' },
  X: { fill: '#2a081c', stroke: '#ff007f', shadow: '#ff007f', textColor: '#ffe0f0' },
  Y: { fill: '#2b1c05', stroke: '#f59e0b', shadow: '#f59e0b', textColor: '#fef3c7' },
  Z: { fill: '#052618', stroke: '#00f59b', shadow: '#00f59b', textColor: '#e0fff2' },
  S: { fill: '#062a1e', stroke: '#10b981', shadow: '#10b981', textColor: '#d1fae5' },
  T: { fill: '#042a25', stroke: '#14b8a6', shadow: '#14b8a6', textColor: '#ccfbf1' },
  RX: { fill: '#2b1405', stroke: '#f97316', shadow: '#f97316', textColor: '#ffedd5' },
  RY: { fill: '#2e0b14', stroke: '#fb7185', shadow: '#fb7185', textColor: '#ffe4e6' },
  RZ: { fill: '#082133', stroke: '#38bdf8', shadow: '#38bdf8', textColor: '#e0f2fe' },
  RESET: { fill: '#1e293b', stroke: '#94a3b8', shadow: '#94a3b8', textColor: '#f8fafc' },
};

export function CircuitCanvas({
  model,
  onCellClick,
  version,
}: {
  model: CircuitModel;
  onCellClick: (qubit: number, step: number) => void;
  version: number;
}) {
  const width = LABEL_W + COLUMNS * CELL + 20;
  const height = model.numQubits * CELL;
  const nodes: ReactNode[] = [];

  // Qubit wires and labels
  for (let q = 0; q < model.numQubits; q++) {
    const y = q * CELL + CELL / 2;

    // Superconducting pipeline glow
    nodes.push(
      <Line
        key={`glow_w${q}`}
        points={[LABEL_W, y, width - 20, y]}
        stroke="rgba(0, 240, 255, 0.12)"
        strokeWidth={5}
        lineCap="round"
      />,
    );
    nodes.push(
      <Line
        key={`w${q}`}
        points={[LABEL_W, y, width - 20, y]}
        stroke="#1e3a5f"
        strokeWidth={2}
        lineCap="round"
      />,
    );

    // Qubit register label (|q0⟩)
    nodes.push(
      <Text
        key={`l${q}`}
        x={10}
        y={y - 8}
        text={`|q${q}⟩`}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fontStyle="bold"
        fill="#38bdf8"
      />,
    );

    // Step cells
    for (let s = 0; s < COLUMNS; s++) {
      const x = LABEL_W + s * CELL + CELL / 2;
      const click = () => onCellClick(q, s);

      // Grid slot outline
      nodes.push(
        <Rect
          key={`slot${q}-${s}`}
          x={x - CELL / 2 + 4}
          y={q * CELL + 4}
          width={CELL - 8}
          height={CELL - 8}
          cornerRadius={8}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
          fill="rgba(255, 255, 255, 0.015)"
          onClick={click}
          onTap={click}
        />,
      );

      const cell = model.cellAt(q, s);
      if (!cell) continue;

      // 1. Single Qubit & Rotation Gates
      if (
        cell.kind === 'H' ||
        cell.kind === 'X' ||
        cell.kind === 'Y' ||
        cell.kind === 'Z' ||
        cell.kind === 'S' ||
        cell.kind === 'T' ||
        cell.kind === 'RESET' ||
        cell.kind === 'RX' ||
        cell.kind === 'RY' ||
        cell.kind === 'RZ'
      ) {
        const theme = GATE_THEMES[cell.kind] || {
          fill: '#1a1f36',
          stroke: '#818cf8',
          shadow: '#818cf8',
          textColor: '#ffffff',
        };

        const displayLabel = cell.kind === 'RESET' ? '|0⟩' : cell.kind;

        nodes.push(
          <Group key={`g_grp${q}-${s}`} onClick={click} onTap={click}>
            <Rect
              x={x - GATE_SIZE / 2}
              y={y - GATE_SIZE / 2}
              width={GATE_SIZE}
              height={GATE_SIZE}
              cornerRadius={8}
              fill={theme.fill}
              stroke={theme.stroke}
              strokeWidth={2}
              shadowColor={theme.shadow}
              shadowBlur={12}
              shadowOpacity={0.6}
            />
            <Text
              x={x - GATE_SIZE / 2}
              y={y - 7}
              width={GATE_SIZE}
              align="center"
              text={displayLabel}
              fontSize={cell.kind.length > 2 ? 12 : 14}
              fontFamily="Outfit, sans-serif"
              fontStyle="bold"
              fill={theme.textColor}
            />
          </Group>,
        );
      }

      // 2. Controlled Gates: CNOT, CZ, CY, TOFFOLI
      else if (
        cell.kind === 'CNOT' ||
        cell.kind === 'CZ' ||
        cell.kind === 'CY' ||
        cell.kind === 'TOFFOLI'
      ) {
        if (cell.role === 'control') {
          nodes.push(
            <Group key={`ctrl_${q}-${s}`} onClick={click} onTap={click}>
              <Circle
                x={x}
                y={y}
                radius={12}
                stroke="rgba(168, 85, 247, 0.4)"
                strokeWidth={1.5}
              />
              <Circle
                x={x}
                y={y}
                radius={7}
                fill="#a855f7"
                shadowColor="#a855f7"
                shadowBlur={12}
                shadowOpacity={0.8}
              />
            </Group>,
          );
        } else {
          // Target
          if (cell.kind === 'CNOT' || cell.kind === 'TOFFOLI') {
            nodes.push(
              <Group key={`tgt_${q}-${s}`} onClick={click} onTap={click}>
                <Circle
                  x={x}
                  y={y}
                  radius={15}
                  fill="#180a2b"
                  stroke="#a855f7"
                  strokeWidth={2}
                  shadowColor="#a855f7"
                  shadowBlur={12}
                  shadowOpacity={0.8}
                />
                <Line points={[x - 10, y, x + 10, y]} stroke="#a855f7" strokeWidth={2} />
                <Line points={[x, y - 10, x, y + 10]} stroke="#a855f7" strokeWidth={2} />
              </Group>,
            );
          } else if (cell.kind === 'CZ') {
            nodes.push(
              <Group key={`tgt_cz_${q}-${s}`} onClick={click} onTap={click}>
                <Rect
                  x={x - GATE_SIZE / 2}
                  y={y - GATE_SIZE / 2}
                  width={GATE_SIZE}
                  height={GATE_SIZE}
                  cornerRadius={8}
                  fill="#052618"
                  stroke="#a855f7"
                  strokeWidth={2}
                  shadowColor="#a855f7"
                  shadowBlur={12}
                />
                <Text
                  x={x - GATE_SIZE / 2}
                  y={y - 7}
                  width={GATE_SIZE}
                  align="center"
                  text="Z"
                  fontSize={14}
                  fontFamily="Outfit, sans-serif"
                  fontStyle="bold"
                  fill="#00f59b"
                />
              </Group>,
            );
          } else if (cell.kind === 'CY') {
            nodes.push(
              <Group key={`tgt_cy_${q}-${s}`} onClick={click} onTap={click}>
                <Rect
                  x={x - GATE_SIZE / 2}
                  y={y - GATE_SIZE / 2}
                  width={GATE_SIZE}
                  height={GATE_SIZE}
                  cornerRadius={8}
                  fill="#2b1c05"
                  stroke="#a855f7"
                  strokeWidth={2}
                  shadowColor="#a855f7"
                  shadowBlur={12}
                />
                <Text
                  x={x - GATE_SIZE / 2}
                  y={y - 7}
                  width={GATE_SIZE}
                  align="center"
                  text="Y"
                  fontSize={14}
                  fontFamily="Outfit, sans-serif"
                  fontStyle="bold"
                  fill="#f59e0b"
                />
              </Group>,
            );
          }
        }
      }

      // 3. SWAP Gate
      else if (cell.kind === 'SWAP') {
        nodes.push(
          <Group key={`swap_${q}-${s}`} onClick={click} onTap={click}>
            <Line points={[x - 9, y - 9, x + 9, y + 9]} stroke="#00f0ff" strokeWidth={3} shadowColor="#00f0ff" shadowBlur={8} />
            <Line points={[x - 9, y + 9, x + 9, y - 9]} stroke="#00f0ff" strokeWidth={3} shadowColor="#00f0ff" shadowBlur={8} />
          </Group>,
        );
      }
    }
  }

  // Vertical multi-qubit connector lines
  for (let s = 0; s < COLUMNS; s++) {
    const multiQubits: number[] = [];
    let isSwap = false;
    for (let q = 0; q < model.numQubits; q++) {
      const c = model.cellAt(q, s);
      if (c) {
        if (
          c.kind === 'CNOT' ||
          c.kind === 'CZ' ||
          c.kind === 'CY' ||
          c.kind === 'TOFFOLI'
        ) {
          multiQubits.push(q);
        } else if (c.kind === 'SWAP') {
          multiQubits.push(q);
          isSwap = true;
        }
      }
    }

    if (multiQubits.length >= 2) {
      const minY = Math.min(...multiQubits) * CELL + CELL / 2;
      const maxY = Math.max(...multiQubits) * CELL + CELL / 2;
      const x = LABEL_W + s * CELL + CELL / 2;
      const lineColor = isSwap ? '#00f0ff' : '#c084fc';
      const shadowColor = isSwap ? '#00f0ff' : '#a855f7';

      nodes.push(
        <Line
          key={`connector_glow_${s}`}
          points={[x, minY, x, maxY]}
          stroke={isSwap ? 'rgba(0, 240, 255, 0.25)' : 'rgba(168, 85, 247, 0.25)'}
          strokeWidth={6}
          lineCap="round"
        />,
      );
      nodes.push(
        <Line
          key={`connector_${s}`}
          points={[x, minY, x, maxY]}
          stroke={lineColor}
          strokeWidth={2.5}
          shadowColor={shadowColor}
          shadowBlur={10}
          shadowOpacity={0.8}
          lineCap="round"
        />,
      );
    }
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-hint">
        <span style={{ color: 'var(--accent-cyan)' }}>✦</span>
        <span>Click any cell to place the selected gate or erase. Multi-qubit gates connect automatically when placed on the same step.</span>
      </div>
      <div className="canvas-inner">
        <Stage width={width} height={height} key={version}>
          <Layer>{nodes}</Layer>
        </Stage>
      </div>
    </div>
  );
}
