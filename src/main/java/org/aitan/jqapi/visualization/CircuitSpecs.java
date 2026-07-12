package org.aitan.jqapi.visualization;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.utils.Constants;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledSwap;
import org.aitan.jqapi.quantum.gates.ControlledY;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.GenericGate;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.MultiControlled;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.PauliS;
import org.aitan.jqapi.quantum.gates.PauliT;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.PauliY;
import org.aitan.jqapi.quantum.gates.PauliZ;
import org.aitan.jqapi.quantum.gates.Phase;
import org.aitan.jqapi.quantum.gates.Reset;
import org.aitan.jqapi.quantum.gates.Rx;
import org.aitan.jqapi.quantum.gates.Ry;
import org.aitan.jqapi.quantum.gates.Rz;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.aitan.jqapi.quantum.gates.U3;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.ComplexCell;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;

/**
 * Bidirectional mapping between the runtime {@link Circuit} and the canonical
 * {@link CircuitSpec}. {@link #toCircuit(CircuitSpec)} is lossless (the spec
 * carries everything); {@link #toSpec(Circuit)} is best-effort (see its javadoc).
 *
 * @author Gaetano Ferrara
 */
public final class CircuitSpecs {

    private CircuitSpecs() {
    }

    /**
     * Builds a runnable {@link Circuit} from a spec. Always lossless: the spec
     * carries angles, control counts and matrices explicitly. {@code IDENTITY}
     * gates are omitted (the {@code Circuit} pads idle wires automatically).
     *
     * @param spec the canonical circuit
     * @return an equivalent runtime circuit
     */
    public static Circuit toCircuit(CircuitSpec spec) {
        return toCircuit(spec, JQAPIConfig.getDefault());
    }

    /**
     * As {@link #toCircuit(CircuitSpec)} but binding the circuit to an explicit
     * configuration. Lets single-threaded runtimes (the WASM/JS build, issue #5
     * phase 2b) pass a {@link JQAPIConfig#sequential(int)} config so the default
     * (parallel) configuration is never reached.
     *
     * @param spec the spec to convert
     * @param config the configuration bounding the resulting circuit
     * @return the equivalent circuit
     */
    public static Circuit toCircuit(CircuitSpec spec, JQAPIConfig config) {
        Circuit circuit = new Circuit(spec.numQubits(), config);
        for (LevelSpec levelSpec : spec.levels()) {
            CircuitLevel level = new CircuitLevel();
            for (GateSpec gateSpec : levelSpec.gates()) {
                Gate gate = build(gateSpec);
                if (gate != null) {
                    level.addGate(gate);
                }
            }
            circuit.addLevel(level);
        }
        return circuit;
    }

    private static Gate build(GateSpec g) {
        List<Integer> t = g.targets();
        List<Integer> c = g.controls();
        return switch (g.kind()) {
            case IDENTITY -> null; // auto-padded by Circuit.addLevel
            case H -> new Hadamard(arr(t));
            case X -> new PauliX(arr(t));
            case Y -> new PauliY(arr(t));
            case Z -> new PauliZ(arr(t));
            case S -> new PauliS(arr(t));
            case T -> new PauliT(arr(t));
            case MEASUREMENT -> new Measurement(arr(t));
            case RESET -> new Reset(arr(t));
            case RX -> new Rx(param(g, "theta"), arr(t));
            case RY -> new Ry(param(g, "theta"), arr(t));
            case RZ -> new Rz(param(g, "theta"), arr(t));
            case PHASE -> new Phase(param(g, "theta"), arr(t));
            case U3 -> new U3(param(g, "theta"), param(g, "phi"), param(g, "lambda"), arr(t));
            case CNOT -> new ControlledNot(c.get(0), t.get(0));
            case CY -> new ControlledY(c.get(0), t.get(0));
            case CZ -> new ControlledZ(c.get(0), t.get(0));
            case SWAP -> new Swap(t.get(0), t.get(1));
            case CSWAP -> new ControlledSwap(c.get(0), t.get(0), t.get(1));
            case TOFFOLI -> new Toffoli(c.get(0), c.get(1), t.get(0));
            case MULTI_CONTROLLED -> new MultiControlled(matrixOf(g), c.size(), controlsThenTargets(g));
            case ORACLE -> new Oracle(matrixOf(g), arr(t));
            case GENERIC -> new GenericGate(matrixOf(g), t.size(), arr(t));
        };
    }

    private static double param(GateSpec g, String name) {
        Double v = g.params().get(name);
        return v == null ? 0.0 : v;
    }

    private static Integer[] arr(List<Integer> list) {
        return list.toArray(new Integer[0]);
    }

    private static Integer[] controlsThenTargets(GateSpec g) {
        List<Integer> all = new ArrayList<>(g.controls());
        all.addAll(g.targets());
        return all.toArray(new Integer[0]);
    }

    private static ComplexMatrix matrixOf(GateSpec g) {
        if (g.matrix() == null) {
            throw new IllegalArgumentException(g.kind() + " gate requires a matrix, but none was provided");
        }
        List<List<ComplexCell>> cells = g.matrix();
        int rows = cells.size();
        int cols = cells.get(0).size();
        Complex[][] data = new Complex[rows][cols];
        for (int r = 0; r < rows; r++) {
            List<ComplexCell> row = cells.get(r);
            for (int col = 0; col < cols; col++) {
                data[r][col] = new Complex(row.get(col).re(), row.get(col).im());
            }
        }
        return ComplexMatrix.createMatrixWithData(data);
    }

    /** Runtime {@code getType()} label → canonical {@link GateKind}. */
    private static final Map<String, GateKind> KIND_BY_TYPE = Map.ofEntries(
            Map.entry(Constants.HADAMARD, GateKind.H),
            Map.entry(Constants.PAULI_X, GateKind.X),
            Map.entry(Constants.PAULI_Y, GateKind.Y),
            Map.entry(Constants.PAULI_Z, GateKind.Z),
            Map.entry(Constants.PAULI_S, GateKind.S),
            Map.entry(Constants.PAULI_T, GateKind.T),
            Map.entry(Constants.IDENTITY, GateKind.IDENTITY),
            Map.entry(Constants.MEASUREMENT, GateKind.MEASUREMENT),
            Map.entry(Constants.RESET, GateKind.RESET),
            Map.entry(Constants.CNot, GateKind.CNOT),
            Map.entry(Constants.CZ, GateKind.CZ),
            Map.entry(Constants.CY, GateKind.CY),
            Map.entry(Constants.SWAP, GateKind.SWAP),
            Map.entry(Constants.CONTROLLED_SWAP, GateKind.CSWAP),
            Map.entry(Constants.TOFFOLI, GateKind.TOFFOLI),
            Map.entry(Constants.RX, GateKind.RX),
            Map.entry(Constants.RY, GateKind.RY),
            Map.entry(Constants.RZ, GateKind.RZ),
            Map.entry(Constants.PHASE, GateKind.PHASE),
            Map.entry(Constants.U3, GateKind.U3),
            Map.entry(Constants.MULTI_CONTROLLED, GateKind.MULTI_CONTROLLED),
            Map.entry(Constants.ORACLE, GateKind.ORACLE),
            Map.entry(Constants.GENERIC_GATE, GateKind.GENERIC));

    /**
     * Best-effort reflect-back of a runtime {@link Circuit} into a spec. The
     * runtime model is lossy, so this cannot always be inverted:
     * <ul>
     *   <li>fixed-arity gates (single-qubit, CNOT/CY/CZ, Swap, CSwap, Toffoli)
     *       reflect exactly, splitting {@code getIndexes()} into controls/targets
     *       by the kind's known arity ({@code Oracle} likewise, matrix preserved);</li>
     *   <li>parametric gates (RX/RY/RZ/PHASE/U3) lose their angle and
     *       {@code MultiControlled} loses its control count, so both
     *       <b>degrade to {@link GateKind#GENERIC}</b> carrying the raw unitary and
     *       {@code getIndexes()} as targets — still renderable and executable.</li>
     * </ul>
     * Idle wires ({@code Identity}) are dropped. Lossless reflect-back is deferred
     * to the accessor-enabler phase.
     *
     * @param circuit the runtime circuit
     * @return an equivalent (best-effort) spec
     */
    public static CircuitSpec toSpec(Circuit circuit) {
        List<LevelSpec> levels = new ArrayList<>();
        for (CircuitLevel level : circuit.getLevels()) {
            List<GateSpec> gates = new ArrayList<>();
            for (Gate gate : level.getGates()) {
                GateKind kind = KIND_BY_TYPE.getOrDefault(gate.getType(), GateKind.GENERIC);
                if (kind == GateKind.IDENTITY) {
                    continue; // idle wires need not be listed
                }
                gates.add(toGateSpec(kind, gate));
            }
            levels.add(new LevelSpec(gates));
        }
        return CircuitSpec.of(circuit.getInputSize(), levels);
    }

    private static GateSpec toGateSpec(GateKind kind, Gate gate) {
        List<Integer> idx = gate.getIndexes();
        return switch (kind) {
            case H, X, Y, Z, S, T, MEASUREMENT, RESET, SWAP ->
                new GateSpec(kind, List.copyOf(idx), List.of(), Map.of(), null);
            case CNOT, CZ, CY ->
                new GateSpec(kind, List.of(idx.get(1)), List.of(idx.get(0)), Map.of(), null);
            case CSWAP ->
                new GateSpec(kind, List.of(idx.get(1), idx.get(2)), List.of(idx.get(0)), Map.of(), null);
            case TOFFOLI ->
                new GateSpec(kind, List.of(idx.get(2)), List.of(idx.get(0), idx.get(1)), Map.of(), null);
            case ORACLE ->
                new GateSpec(kind, List.copyOf(idx), List.of(), Map.of(), toCells(gate.getMatrix()));
            // lossy: parametric angles and MultiControlled control-count are unrecoverable
            default ->
                new GateSpec(GateKind.GENERIC, List.copyOf(idx), List.of(), Map.of(), toCells(gate.getMatrix()));
        };
    }

    private static List<List<ComplexCell>> toCells(ComplexMatrix m) {
        int rows = m.getRowDimension();
        int cols = m.getColumnDimension();
        List<List<ComplexCell>> cells = new ArrayList<>(rows);
        for (int r = 0; r < rows; r++) {
            List<ComplexCell> row = new ArrayList<>(cols);
            for (int col = 0; col < cols; col++) {
                Complex e = m.getEntry(r, col);
                row.add(new ComplexCell(e.getReal(), e.getImaginary()));
            }
            cells.add(row);
        }
        return cells;
    }
}
