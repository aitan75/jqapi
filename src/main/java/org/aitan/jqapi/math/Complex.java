package org.aitan.jqapi.math;

/**
 * Immutable complex number, backed by two primitive {@code double} fields.
 * <p>
 * This is jqapi's own replacement for {@code org.apache.commons.math3.complex.Complex}
 * (issue #12): it keeps the exact method names, numeric behavior and
 * {@code equals}/{@code hashCode}/{@code toString} semantics that the codebase
 * relied on, so the only visible change for external consumers is the import
 * path ({@code org.aitan.jqapi.math.Complex}).
 * <p>
 * <b>Behavioral caveat:</b> {@link #sqrt()} implements the principal square root
 * for finite inputs only, which is the sole case that occurs here (amplitudes are
 * always finite). The general-purpose NaN/Infinity hardening that commons-math3
 * provided is intentionally not replicated.
 *
 * @author Gaetano Ferrara
 */
public final class Complex {

    /** The complex number 0 + 0i. */
    public static final Complex ZERO = new Complex(0.0, 0.0);
    /** The complex number 1 + 0i. */
    public static final Complex ONE = new Complex(1.0, 0.0);
    /** The imaginary unit 0 + 1i. */
    public static final Complex I = new Complex(0.0, 1.0);

    private final double real;
    private final double imaginary;

    /**
     * @param real the real part
     * @param imaginary the imaginary part
     */
    public Complex(double real, double imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    /** @return the real part */
    public double getReal() {
        return real;
    }

    /** @return the imaginary part */
    public double getImaginary() {
        return imaginary;
    }

    /**
     * @param addend the value to add
     * @return {@code this + addend}
     */
    public Complex add(Complex addend) {
        return new Complex(real + addend.real, imaginary + addend.imaginary);
    }

    /**
     * @param addend the real value to add
     * @return {@code this + addend}
     */
    public Complex add(double addend) {
        return new Complex(real + addend, imaginary);
    }

    /**
     * @param subtrahend the value to subtract
     * @return {@code this - subtrahend}
     */
    public Complex subtract(Complex subtrahend) {
        return new Complex(real - subtrahend.real, imaginary - subtrahend.imaginary);
    }

    /**
     * @param factor the value to multiply by
     * @return {@code this * factor}
     */
    public Complex multiply(Complex factor) {
        return new Complex(real * factor.real - imaginary * factor.imaginary,
                real * factor.imaginary + imaginary * factor.real);
    }

    /**
     * @param factor the real value to multiply by
     * @return {@code this * factor}
     */
    public Complex multiply(double factor) {
        return new Complex(real * factor, imaginary * factor);
    }

    /** @return the absolute value (modulus) of this complex number */
    public double abs() {
        return Math.hypot(real, imaginary);
    }

    /**
     * Returns the principal square root of this complex number, using the same
     * algorithm commons-math3 used for finite inputs.
     *
     * @return the principal square root
     */
    public Complex sqrt() {
        if (real == 0.0 && imaginary == 0.0) {
            return new Complex(0.0, 0.0);
        }
        double t = Math.sqrt((Math.abs(real) + abs()) / 2.0);
        if (real >= 0.0) {
            return new Complex(t, imaginary / (2.0 * t));
        } else {
            return new Complex(Math.abs(imaginary) / (2.0 * t),
                    Math.copySign(1.0, imaginary) * t);
        }
    }

    /**
     * @return the principal square root of {@code 1 - this*this}
     */
    public Complex sqrt1z() {
        return ONE.subtract(this.multiply(this)).sqrt();
    }

    /**
     * Exact equality on the real and imaginary parts, matching the semantics of
     * commons-math3's {@code Complex.equals} (primitive {@code ==}, so
     * {@code -0.0} equals {@code 0.0}).
     */
    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof Complex)) {
            return false;
        }
        Complex c = (Complex) other;
        return real == c.real && imaginary == c.imaginary;
    }

    @Override
    public int hashCode() {
        // Normalize -0.0 to 0.0 so that values equal under equals() hash alike.
        int result = Double.hashCode(real == 0.0 ? 0.0 : real);
        result = 31 * result + Double.hashCode(imaginary == 0.0 ? 0.0 : imaginary);
        return result;
    }

    /** @return this complex number formatted as {@code (real, imaginary)} */
    @Override
    public String toString() {
        return "(" + real + ", " + imaginary + ")";
    }
}
