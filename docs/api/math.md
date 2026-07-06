# Linear Algebra — `org.aitan.jqapi.math`

Complex-valued vector and matrix types underpinning quantum states and gate
operators. Both extend Apache Commons Math types, so all inherited operations
are available.

- [Back to API index](README.md)
- Related: [Quantum core](quantum.md) · [Gates](gates.md) · [Simulator](simulator.md)

## Contents

- [ComplexVector](#complexvector)
- [ComplexMatrix](#complexmatrix)

> All scalars are `org.apache.commons.math3.complex.Complex`
> (`Complex.ONE`, `Complex.ZERO`, `Complex.I`).

---

## `ComplexVector`

`extends org.apache.commons.math3.linear.ArrayFieldVector<Complex>`

A complex vector used for qubit amplitudes and register states. Inherits
`getEntry(int)`, `setEntry(int, Complex)`, `getDimension()`, `getData()`,
`dotProduct(...)`, `outerProduct(...)`, `operate(...)`, etc. from the Commons
Math base.

### Constructors

| Constructor | Description |
|-------------|-------------|
| `ComplexVector(int size)` | Zero vector of the given size. |
| `ComplexVector(Complex[] complex)` | Vector wrapping the given amplitudes. |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `tensorProduct(ComplexVector v)` | `ComplexVector` | Tensor (Kronecker) product `this ⊗ v`, via outer product + vectorization. |
| `matrixVectorization(FieldMatrix<Complex> m)` | `ComplexVector` | Column-stacks a matrix into a vector. |
| `factorize(FieldVector<Complex> v)` *(static)* | `ComplexVector[]` | Splits a `2^n` state vector into `n` single-qubit vectors derived from marginal probabilities. |
| `toString()` | `String` | e.g. `ComplexVector{[(1.0, 0.0), (0.0, 0.0)]}`. |

> **Note on `factorize`.** It reconstructs each qubit from marginal
> probabilities, so **relative phases are not recovered** and the result is only
> meaningful for separable states. This is the primitive behind
> [`QuantumRegister.getQubitRegisterState`](quantum.md#getqubitregisterstate),
> which adds the entanglement check.

```java
import org.aitan.jqapi.math.ComplexVector;
import org.apache.commons.math3.complex.Complex;

// Tensor product of |1> and |0>  ->  |10>  = [0, 0, 1, 0]
ComplexVector one  = new QubitOne().getValue();
ComplexVector zero = new QubitZero().getValue();
ComplexVector product = zero.tensorProduct(one);

// Factorize a 4-dim separable state back into 2 qubit vectors
ComplexVector[] parts = ComplexVector.factorize(product);
```

---

## `ComplexMatrix`

`extends org.apache.commons.math3.linear.BlockFieldMatrix<Complex>`

A complex matrix used for gate operators. Constructed via static factories
(constructors are private). Inherits `getEntry(int,int)`, `getRowDimension()`,
`getColumnDimension()`, `getData()`, `operate(...)`, etc.

### Static factory methods

| Method | Returns | Description |
|--------|---------|-------------|
| `createIdentityMatrix(int size)` | `ComplexMatrix` | `size x size` identity. |
| `createMatrixWithData(Complex[][] data)` | `ComplexMatrix` | Matrix from a 2-D complex array. |
| `createGateMatrix(Gate g)` | `ComplexMatrix` | Convenience: returns `g.getMatrix()`. |
| `kroneckerProduct(List<ComplexMatrix> matrices)` | `ComplexMatrix` | Kronecker product of the matrices, in order. |

### `kroneckerProduct(List<ComplexMatrix>)`

- **Throws** `IllegalArgumentException` if the list is `null` or empty
  (`"No input matrices"`).
- Returns the single element unchanged when the list has size 1.

```java
import java.util.List;
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
