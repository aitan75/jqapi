package org.aitan.jqapi.test;
import org.aitan.jqapi.math.*;
import org.aitan.jqapi.observable.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
public class Issue108InnerProductTest {
    @Test
    void innerProductDistinguishesHermitianFromBilinear() {
        Complex s = new Complex(Math.sqrt(0.5), 0);
        Complex[] psi = new Complex[]{ Complex.ONE.multiply(s), Complex.I.multiply(s) };
        ComplexVector v = new ComplexVector(psi);
        assertEquals(0.0, v.dotProduct(v).abs(), 1e-12, "bilinear dotProduct should be 0");
        assertEquals(1.0, v.innerProduct(v).getReal(), 1e-12);
    }
    @Test
    void conjugateSymmetryOverlapFidelity() {
        assertEquals(Complex.I, Complex.I.conjugate().conjugate());
        ComplexVector a = new ComplexVector(new Complex[]{new Complex(1, 2), new Complex(3, -1)});
        ComplexVector b = new ComplexVector(new Complex[]{new Complex(0, 1), new Complex(2, 0)});
        Complex ab = a.innerProduct(b);
        Complex ba = b.innerProduct(a);
        assertEquals(ab.getReal(), ba.conjugate().getReal(), 1e-12);
        assertEquals(ab.getImaginary(), ba.conjugate().getImaginary(), 1e-12);
    }
    @Test
    void fidelityOrthogonalAndPhaseInvariant() {
        Complex s = new Complex(Math.sqrt(0.5), 0);
        ComplexVector plusI = new ComplexVector(new Complex[]{ Complex.ONE.multiply(s), Complex.I.multiply(s) });
        ComplexVector minusI = new ComplexVector(new Complex[]{ Complex.ONE.multiply(s), Complex.I.multiply(s).multiply(new Complex(-1, 0)) });
        assertEquals(0.0, Expectation.fidelity(plusI, minusI), 1e-9);
        ComplexVector plusIPhase = new ComplexVector(new Complex[]{ Complex.I.multiply(plusI.getEntry(0)), Complex.I.multiply(plusI.getEntry(1)) });
        assertEquals(1.0, Expectation.fidelity(plusI, plusIPhase), 1e-9);
    }
    @Test
    void validationErrors() {
        ComplexVector v2 = new ComplexVector(new Complex[]{Complex.ONE, Complex.ONE});
        ComplexVector v4 = new ComplexVector(new Complex[]{Complex.ONE, Complex.ONE, Complex.ONE, Complex.ONE});
        assertThrows(IllegalArgumentException.class, () -> v2.innerProduct(v4));
        assertThrows(IllegalArgumentException.class, () -> Expectation.fidelity(v2, v4));
    }
    @Test
    void fidelityRejectsNonNormalized() {
        ComplexVector norm = new ComplexVector(new Complex[]{new Complex(Math.sqrt(0.5), 0), new Complex(Math.sqrt(0.5), 0)});
        ComplexVector big = new ComplexVector(new Complex[]{new Complex(2, 0), new Complex(0, 0)});
        assertThrows(IllegalArgumentException.class, () -> Expectation.fidelity(norm, big));
    }
    @Test
    void overlapConjugatesTheFirstArgument() {
        double s = Math.sqrt(0.5);
        ComplexVector plusI = new ComplexVector(new Complex[]{new Complex(s, 0), new Complex(0, s)});
        ComplexVector one = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ONE});
        // ⟨+i|1⟩ = conj(i/√2) = −i/√2, while ⟨1|+i⟩ = +i/√2.
        assertEquals(new Complex(0, -s), Expectation.overlap(plusI, one));
        assertEquals(new Complex(0, s), Expectation.overlap(one, plusI));
        ComplexVector a = new ComplexVector(new Complex[]{new Complex(1, 2), new Complex(3, -1)});
        ComplexVector b = new ComplexVector(new Complex[]{new Complex(0, 1), new Complex(2, 0)});
        // (1 − 2i)·i + (3 + i)·2 = 8 + 3i
        assertEquals(new Complex(8, 3), a.innerProduct(b));
        assertEquals(new Complex(8, 3), Expectation.overlap(a, b));
    }

    @Test
    void fidelityOfZeroAndPlusIsOneHalf() {
        ComplexVector zero = new ComplexVector(new Complex[]{Complex.ONE, Complex.ZERO});
        ComplexVector plus = new ComplexVector(new Complex[]{new Complex(Math.sqrt(0.5), 0), new Complex(Math.sqrt(0.5), 0)});
        assertEquals(Math.sqrt(0.5), Expectation.overlap(zero, plus).abs(), 1e-12);
        assertEquals(0.5, Expectation.fidelity(zero, plus), 1e-12);
    }

    @Test
    void overlapRejectsNonFiniteAmplitudes() {
        ComplexVector zero = new ComplexVector(new Complex[]{Complex.ONE, Complex.ZERO});
        ComplexVector nan = new ComplexVector(new Complex[]{new Complex(Double.NaN, 0), Complex.ZERO});
        ComplexVector inf = new ComplexVector(new Complex[]{new Complex(0, Double.POSITIVE_INFINITY), Complex.ZERO});
        assertThrows(IllegalArgumentException.class, () -> Expectation.overlap(nan, zero));
        assertThrows(IllegalArgumentException.class, () -> Expectation.overlap(zero, inf));
    }

    @Test
    void fidelityRejectsNaN() {
        ComplexVector nan = new ComplexVector(new Complex[]{new Complex(Double.NaN, 0), Complex.ZERO});
        ComplexVector zero = new ComplexVector(new Complex[]{Complex.ONE, Complex.ZERO});
        assertThrows(IllegalArgumentException.class, () -> Expectation.fidelity(nan, zero));
    }
    @Test
    void nullInputRejected() {
        assertThrows(NullPointerException.class, () -> new ComplexVector((Complex[]) null));
        assertThrows(NullPointerException.class, () -> Expectation.overlap(null, new ComplexVector(2)));
    }
}
