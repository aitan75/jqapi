# Linear Algebra — `org.aitan.jqapi.math`

Complex-valued scalar, vector and matrix types underpinning quantum states and
gate operators. As of issue #12 these are jqapi's own types with **no
third-party dependency**: they are backed by primitive `double[]` arrays in an
interleaved `(re, im)` layout.

- [Back to API index](README.md)
- Related: [Quantum core](quantum.md) · [Gates](gates.md) · [Simulator](simulator.md)

## Contents

- [Complex](#complex)
- [ComplexVector](#complexvector)
- [ComplexMatrix](#complexmatrix)

---

## `Complex`

`final class` — immutable complex number backed by two `double` fields.

### Constructor & constants

| Member | Description |
|--------|-------------|
| `Complex(double re, double im)` | Builds `re + im·i`. |
| `Complex.ZERO` | `0 + 0i`. |
| `Complex.ONE` | `1 + 0i`. |
| `Complex.I` | `0 + 1i`. |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getReal()` / `getImaginary()` | `double` | Real / imaginary part. |
| `add(Complex)` / `add(double)` | `Complex` | Addition. |
| `subtract(Complex)` | `Complex` | Subtraction. |
| `multiply(Complex)` / `multiply(double)` | `Complex` | Multiplication. |
| `abs()` | `double` | Modulus (`Math.hypot`). |
| `sqrt()` | `Complex` | Principal square root (finite inputs). |
| `sqrt1z()` | `Complex` | Principal square root of `1 - this²`. |
| `equals` / `hashCode` | | Exact `==` comparison on real/imaginary parts (matches the previous behavior; `-0.0` equals `0.0`). |
| `toString()` | `String` | `(real, imaginary)`, e.g. `(1.0, 0.0)`. |

> **Behavioral caveat.** `sqrt()`/`sqrt1z()` implement the principal square root
> for **finite** inputs only — the sole case that occurs in this codebase, where
> amplitudes are always finite. General-purpose NaN/Infinity hardening is
> intentionally not replicated.

---

## `ComplexVector`

A complex vector used for qubit amplitudes and register states, backed by a
primitive `double[]` (interleaved `(re, im)`).

### Constructors

| Constructor | Description |
|-------------|-------------|
| `ComplexVector(int size)` | Zero vector of the given size. |
| `ComplexVector(Complex[] values)` | Vector wrapping the given amplitudes. |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getEntry(int i)` | `Complex` | Amplitude at index `i`. |
| `setEntry(int i, Complex v)` | `void` | Sets the amplitude at index `i`. |
| `getDimension()` | `int` | Number of complex entries. |
| `getData()` | `Complex[]` | Boxed copy of the amplitudes. |
| `dotProduct(ComplexVector v)` | `Complex` | Non-conjugated dot product `Σ this[i]·v[i]`. |
| `outerProduct(ComplexVector v)` | `ComplexMatrix` | Outer product, entry `(i,j) = this[i]·v[j]`. |
| `tensorProduct(ComplexVector v)` | `ComplexVector` | Tensor (Kronecker) product `this ⊗ v`. |
| `factorize(ComplexVector v)` *(static)* | `ComplexVector[]` | Splits a `2^n` state vector into `n` single-qubit vectors derived from marginal probabilities. |
| `equals` / `hashCode` | | Element-wise equality (same `==` semantics as `Complex`). |
| `toString()` | `String` | e.g. `ComplexVector{[(1.0, 0.0), (0.0, 0.0)]}`. |

> **Note on `factorize`.** It reconstructs each qubit from marginal
> probabilities, so **relative phases are not recovered** and the result is only
> meaningful for separable states. This is the primitive behind
> [`QuantumRegister.getQubitRegisterState`](quantum.md#getqubitregisterstate),
> which adds the entanglement check.

```java
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.math.Complex;

// Tensor product of |1> and |0>  ->  |10>  = [0, 0, 1, 0]
ComplexVector one  = new QubitOne().getValue();
ComplexVector zero = new QubitZero().getValue();
ComplexVector product = zero.tensorProduct(one);

// Factorize a 4-dim separable state back into 2 qubit vectors
ComplexVector[] parts = ComplexVector.factorize(product);
```

---

## `ComplexMatrix`

A complex matrix used for gate operators, backed by a flat primitive `double[]`
(row-major, interleaved `(re, im)`). Constructed via static factories
(constructors are private).

### Static factory methods

| Method | Returns | Description |
|--------|---------|-------------|
| `createIdentityMatrix(int size)` | `ComplexMatrix` | `size x size` identity. |
| `createMatrixWithData(Complex[][] data)` | `ComplexMatrix` | Matrix from a 2-D complex array. |
| `createGateMatrix(Gate g)` | `ComplexMatrix` | Convenience: returns `g.getMatrix()`. |
| `kroneckerProduct(List<ComplexMatrix> matrices)` | `ComplexMatrix` | Kronecker product of the matrices, in order. |

### Instance methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getEntry(int r, int c)` | `Complex` | Entry at row `r`, column `c`. |
| `getRowDimension()` / `getColumnDimension()` | `int` | Dimensions. |
| `getData()` | `Complex[][]` | Boxed row-major copy of the entries. |
| `operate(ComplexVector v)` | `ComplexVector` | Matrix-vector product `M·v`. |
| `equals` / `hashCode` | | Element-wise equality (same `==` semantics as `Complex`). |
| `toString()` | `String` | e.g. `ComplexMatrix{[(1.0, 0.0), (0.0, 0.0)], [...]}`. |

### `kroneckerProduct(List<ComplexMatrix>)`

- **Throws** `IllegalArgumentException` if the list is `null` or empty
  (`"No input matrices"`).
- Returns the single element unchanged when the list has size 1.

```java
import java.util.List;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.gates.Identity;
import org.aitan.jqapi.quantum.gates.PauliX;

// I ⊗ X  (a 4x4 operator)
ComplexMatrix i = ComplexMatrix.createGateMatrix(new Identity());
ComplexMatrix x = ComplexMatrix.createGateMatrix(new PauliX(0));
ComplexMatrix ix = ComplexMatrix.kroneckerProduct(List.of(i, x));

// Custom matrix from raw data (e.g. for an Oracle)
Complex[][] data = { {Complex.ONE, Complex.ZERO}, {Complex.ZERO, Complex.ONE} };
ComplexMatrix custom = ComplexMatrix.createMatrixWithData(data);
```

Custom matrices built here can be wrapped in an
[`Oracle`](gates.md#oracle) or [`GenericGate`](gates.md#genericgate).
