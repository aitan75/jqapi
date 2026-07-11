package org.aitan.jqapi.visualization;

import java.util.ArrayList;
import java.util.List;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
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
        Circuit circuit = new Circuit(spec.numQubits());
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
            case MULTI_CONTROLLED -> new MultiControlled(toMatrix(g.matrix()), c.size(), controlsThenTargets(g));
            case ORACLE -> new Oracle(toMatrix(g.matrix()), arr(t));
            case GENERIC -> new GenericGate(toMatrix(g.matrix()), t.size(), arr(t));
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

    private static ComplexMatrix toMatrix(ComplexCell[][] cells) {
        Complex[][] data = new Complex[cells.length][cells[0].length];
        for (int r = 0; r < cells.length; r++) {
            for (int col = 0; col < cells[r].length; col++) {
                data[r][col] = new Complex(cells[r][col].re(), cells[r][col].im());
            }
        }
        return ComplexMatrix.createMatrixWithData(data);
    }
}
