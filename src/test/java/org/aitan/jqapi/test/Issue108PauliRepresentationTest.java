package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.aitan.jqapi.observable.Pauli;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.observable.PauliSum.Term;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Issue #108 phase B: immutable Pauli strings and sums, MSB ordering and validation. */
class Issue108PauliRepresentationTest {

    @Test
    void labelCharZeroIsQubitZeroAndTheMostSignificantBit() {
        PauliString zi = PauliString.fromLabel("ZI");
        assertEquals(0b10, zi.zMask());
        assertEquals(0, zi.xMask());
        assertEquals(1, PauliString.fromLabel("IZ").zMask());

        PauliString xiy = PauliString.fromLabel("XIY");
        assertEquals(0b101, xiy.xMask());
        assertEquals(0b001, xiy.zMask());
        assertEquals(1, xiy.yCount());
        assertEquals(Pauli.X, xiy.get(0));
        assertEquals(Pauli.I, xiy.get(1));
        assertEquals(Pauli.Y, xiy.get(2));
        assertEquals(3, xiy.numQubits());
        assertEquals("XIY", xiy.toString());
    }

    @Test
    void sparseFormEqualsLabelForm() {
        PauliString sparse = PauliString.of(3, Map.of(0, Pauli.X, 2, Pauli.Z));
        assertEquals(PauliString.fromLabel("XIZ"), sparse);
        assertEquals(PauliString.fromLabel("XIZ").hashCode(), sparse.hashCode());
        assertEquals(PauliString.fromLabel("II"), PauliString.of(2, Map.of()));
        assertEquals(PauliString.fromLabel("IY"), PauliString.of(2, Map.of(0, Pauli.I, 1, Pauli.Y)));
        Map<Integer, Pauli> source = new HashMap<>(Map.of(1, Pauli.X));
        PauliString copied = PauliString.of(2, source);
        source.put(0, Pauli.Z);
        assertEquals(PauliString.fromLabel("IX"), copied);
        assertNotEquals(PauliString.fromLabel("XI"), PauliString.fromLabel("IX"));
        assertNotEquals(PauliString.fromLabel("I"), PauliString.fromLabel("II"));
    }

    @Test
    void rejectsInvalidLabels() {
        assertThrows(NullPointerException.class, () -> PauliString.fromLabel(null));
        assertThrows(IllegalArgumentException.class, () -> PauliString.fromLabel(""));
        assertThrows(IllegalArgumentException.class, () -> PauliString.fromLabel("A"));
        assertThrows(IllegalArgumentException.class, () -> PauliString.fromLabel("XYZQ"));
        assertThrows(IllegalArgumentException.class, () -> PauliString.fromLabel("xz"));
        assertThrows(IllegalArgumentException.class, () -> PauliString.fromLabel("X".repeat(31)));
        assertEquals(30, PauliString.fromLabel("X".repeat(30)).numQubits());
    }

    @Test
    void rejectsInvalidSparseInput() {
        assertThrows(IllegalArgumentException.class, () -> PauliString.of(0, Map.of()));
        assertThrows(IllegalArgumentException.class, () -> PauliString.of(31, Map.of()));
        assertThrows(IllegalArgumentException.class, () -> PauliString.of(3, Map.of(3, Pauli.X)));
        assertThrows(IllegalArgumentException.class, () -> PauliString.of(3, Map.of(-1, Pauli.X)));
        assertThrows(NullPointerException.class, () -> PauliString.of(3, null));
        Map<Integer, Pauli> nullPauli = new HashMap<>();
        nullPauli.put(0, null);
        assertThrows(NullPointerException.class, () -> PauliString.of(3, nullPauli));
        assertThrows(IllegalArgumentException.class, () -> PauliString.fromLabel("XI").get(2));
    }

    @Test
    void rejectsInvalidTermsAndSums() {
        PauliString z = PauliString.fromLabel("Z");
        assertThrows(IllegalArgumentException.class, () -> new Term(Double.NaN, z));
        assertThrows(IllegalArgumentException.class, () -> new Term(Double.POSITIVE_INFINITY, z));
        assertThrows(IllegalArgumentException.class, () -> new Term(Double.NEGATIVE_INFINITY, z));
        assertThrows(NullPointerException.class, () -> new Term(1.0, null));
        assertThrows(IllegalArgumentException.class, () -> PauliSum.of(List.of()));
        assertThrows(IllegalArgumentException.class,
                () -> PauliSum.of(new Term(1.0, z), new Term(1.0, PauliString.fromLabel("ZZ"))));
        assertThrows(NullPointerException.class, () -> PauliSum.of((List<Term>) null));
        List<Term> withNull = new ArrayList<>();
        withNull.add(null);
        assertThrows(NullPointerException.class, () -> PauliSum.of(withNull));
    }

    @Test
    void sumIsImmutableAndComparable() {
        List<Term> source = new ArrayList<>(List.of(new Term(0.5, PauliString.fromLabel("ZZ"))));
        PauliSum sum = PauliSum.of(source);
        source.add(new Term(-1.0, PauliString.fromLabel("XX")));
        assertEquals(1, sum.terms().size());
        assertEquals(2, sum.numQubits());
        assertThrows(UnsupportedOperationException.class, () -> sum.terms().add(new Term(1.0, PauliString.fromLabel("II"))));
        assertEquals(PauliSum.of(new Term(0.5, PauliString.fromLabel("ZZ"))), sum);
        assertEquals(PauliSum.of(new Term(0.5, PauliString.fromLabel("ZZ"))).hashCode(), sum.hashCode());
        assertNotEquals(PauliSum.of(new Term(0.25, PauliString.fromLabel("ZZ"))), sum);
    }
}
