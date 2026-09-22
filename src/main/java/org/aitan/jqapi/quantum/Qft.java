package org.aitan.jqapi.quantum;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.MultiControlled;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.utils.Constants;

/**
 * Builds exact quantum Fourier transform (QFT) circuits from jqapi's local
 * gates. The first target is the most significant bit of the transformed
 * sub-register; target indexes need not be adjacent.
 * <p>
 * The transform has {@code O(n^2)} gates. It uses only local gates, so the
 * simulator continues to evolve the state vector without materializing a
 * full-system Fourier matrix.
 */
public final class Qft {

    private Qft() {
    }

    /**
     * Creates a circuit that applies the forward QFT to all its qubits.
     *
     * @param qubitCount number of qubits in the circuit
     * @return a new circuit containing the forward QFT
     */
    public static Circuit forward(int qubitCount) {
        Circuit circuit = new Circuit(qubitCount);
        appendForward(circuit, indexes(qubitCount));
        return circuit;
    }

    /**
     * Creates a circuit that applies the inverse QFT to all its qubits.
     *
     * @param qubitCount number of qubits in the circuit
     * @return a new circuit containing the inverse QFT
     */
    public static Circuit inverse(int qubitCount) {
        Circuit circuit = new Circuit(qubitCount);
        appendInverse(circuit, indexes(qubitCount));
        return circuit;
    }

    /**
     * Appends a forward QFT to {@code circuit} over the requested targets.
     * The targets define the transformed sub-register order: its first target
     * is the most significant bit. All targets must be distinct indexes in the
     * circuit.
     *
     * @param circuit circuit to extend
     * @param targets transformed qubits, most significant first
     */
    public static void appendForward(Circuit circuit, int... targets) {
        validateTargets(circuit, targets);

        for (int target = 0; target < targets.length; target++) {
            addGate(circuit, new Hadamard(targets[target]));
            for (int control = target + 1; control < targets.length; control++) {
                addControlledPhase(circuit, targets[control], targets[target],
                        phaseAngle(control - target));
            }
        }
        appendBitReversal(circuit, targets);
    }

    /**
     * Appends an inverse QFT to {@code circuit} over the requested targets.
     * The target order has the same meaning as in {@link #appendForward}.
     *
     * @param circuit circuit to extend
     * @param targets transformed qubits, most significant first
     */
    public static void appendInverse(Circuit circuit, int... targets) {
        validateTargets(circuit, targets);

        appendBitReversal(circuit, targets);
        for (int target = targets.length - 1; target >= 0; target--) {
            for (int control = targets.length - 1; control > target; control--) {
                addControlledPhase(circuit, targets[control], targets[target],
                        -phaseAngle(control - target));
            }
            addGate(circuit, new Hadamard(targets[target]));
        }
    }

    private static int[] indexes(int qubitCount) {
        int[] indexes = new int[qubitCount];
        for (int index = 0; index < qubitCount; index++) {
            indexes[index] = index;
        }
        return indexes;
    }

    private static void validateTargets(Circuit circuit, int[] targets) {
        Objects.requireNonNull(circuit, "circuit");
        Objects.requireNonNull(targets, "targets");
        if (targets.length == 0) {
            throw new IllegalArgumentException("QFT requires at least one target qubit");
        }

        Set<Integer> seen = new HashSet<>();
        for (int target : targets) {
            if (target < 0 || target >= circuit.getInputSize()) {
                throw new IllegalArgumentException("QFT target " + target
                        + " is outside circuit qubit indexes [0, "
                        + (circuit.getInputSize() - 1) + "]");
            }
            if (!seen.add(target)) {
                throw new IllegalArgumentException("QFT target indexes must be distinct: " + target);
            }
        }
    }

    private static double phaseAngle(int distance) {
        return Math.scalb(2.0 * Math.PI, -(distance + 1));
    }

    private static void addControlledPhase(Circuit circuit, int control, int target, double angle) {
        addGate(circuit, new MultiControlled(Constants.phaseMatrix(angle), 1, control, target));
    }

    private static void addGate(Circuit circuit, org.aitan.jqapi.quantum.gates.Gate gate) {
        CircuitLevel level = new CircuitLevel();
        level.addGate(gate);
        circuit.addLevel(level);
    }

    private static void appendBitReversal(Circuit circuit, int[] targets) {
        CircuitLevel swaps = new CircuitLevel();
        for (int low = 0, high = targets.length - 1; low < high; low++, high--) {
            swaps.addGate(new Swap(targets[low], targets[high]));
        }
        if (!swaps.getGates().isEmpty()) {
            circuit.addLevel(swaps);
        }
    }
}
