package org.aitan.jqapi.observable;

import java.util.Map;
import java.util.Objects;
import org.aitan.jqapi.JQAPIConfig;

/**
 * Immutable tensor product of single-qubit Paulis, without coefficient.
 * <p>
 * Stored as bit masks over basis-state indexes: qubit {@code q} maps to bit
 * {@code numQubits - 1 - q}, so qubit 0 is the most significant bit. X and Y set
 * the X mask, Z and Y set the Z mask.
 *
 * @param numQubits number of qubits, from 1 to {@value JQAPIConfig#ABSOLUTE_MAX_QUBITS}
 * @param xMask basis-index bits flipped by X or Y
 * @param zMask basis-index bits phased by Z or Y
 */
public record PauliString(int numQubits, int xMask, int zMask) {

    public PauliString {
        requireQubits(numQubits);
        if ((xMask | zMask) >>> numQubits != 0) {
            throw new IllegalArgumentException("Pauli masks must fit " + numQubits + " qubits");
        }
    }

    /**
     * @param label one of I, X, Y, Z per qubit; character 0 is qubit 0 (MSB)
     * @return the parsed Pauli string
     */
    public static PauliString fromLabel(String label) {
        Objects.requireNonNull(label, "label");
        int n = label.length();
        requireQubits(n);
        int x = 0;
        int z = 0;
        for (int q = 0; q < n; q++) {
            int bit = 1 << (n - 1 - q);
            switch (label.charAt(q)) {
                case 'I' -> { }
                case 'X' -> x |= bit;
                case 'Y' -> { x |= bit; z |= bit; }
                case 'Z' -> z |= bit;
                default -> throw new IllegalArgumentException("Pauli label may contain only I, X, Y, Z");
            }
        }
        return new PauliString(n, x, z);
    }

    /**
     * @param numQubits number of qubits
     * @param paulis non-identity factors by qubit index; absent qubits are I
     * @return the Pauli string
     */
    public static PauliString of(int numQubits, Map<Integer, Pauli> paulis) {
        Objects.requireNonNull(paulis, "paulis");
        requireQubits(numQubits);
        char[] label = "I".repeat(numQubits).toCharArray();
        for (Map.Entry<Integer, Pauli> entry : paulis.entrySet()) {
            int q = Objects.requireNonNull(entry.getKey(), "qubit");
            if (q < 0 || q >= numQubits) throw new IllegalArgumentException("Qubit index out of range: " + q);
            label[q] = Objects.requireNonNull(entry.getValue(), "pauli").name().charAt(0);
        }
        return fromLabel(new String(label));
    }

    /**
     * @param qubit qubit index, 0 = MSB
     * @return the Pauli factor acting on {@code qubit}
     */
    public Pauli get(int qubit) {
        if (qubit < 0 || qubit >= numQubits) throw new IllegalArgumentException("Qubit index out of range: " + qubit);
        int bit = 1 << (numQubits - 1 - qubit);
        boolean x = (xMask & bit) != 0;
        boolean z = (zMask & bit) != 0;
        return x ? (z ? Pauli.Y : Pauli.X) : (z ? Pauli.Z : Pauli.I);
    }

    /** @return number of Y factors, which contribute a global factor i^yCount */
    public int yCount() {
        return Integer.bitCount(xMask & zMask);
    }

    /** @return the label form, character 0 = qubit 0 */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder(numQubits);
        for (int q = 0; q < numQubits; q++) sb.append(get(q).name());
        return sb.toString();
    }

    private static void requireQubits(int numQubits) {
        if (numQubits < 1 || numQubits > JQAPIConfig.ABSOLUTE_MAX_QUBITS) {
            throw new IllegalArgumentException("Pauli string qubits must be in [1, " + JQAPIConfig.ABSOLUTE_MAX_QUBITS + "]");
        }
    }
}
