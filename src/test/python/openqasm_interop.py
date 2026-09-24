"""Generate external fixtures, or validate exports produced by OpenQasmInteropTest.

Install requirements-openqasm.txt in a virtualenv; run this script with --generate
only when intentionally regenerating fixtures. Normal validation needs mvn test first.
"""
import argparse
from pathlib import Path

import cirq
import numpy as np
import qiskit
from qiskit import QuantumCircuit, qasm2
from qiskit.circuit.library import U1Gate, U3Gate
from qiskit.quantum_info import Statevector

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = ROOT / "src/test/resources/openqasm"
EXPORTS = ROOT / "target/openqasm-interop"


def msb_state(qiskit_state):
    """Qiskit indexes q[0] as LSB; jqapi indexes it as MSB."""
    width = (len(qiskit_state) - 1).bit_length()
    return np.array([qiskit_state[int(f"{i:0{width}b}"[::-1], 2)] for i in range(len(qiskit_state))])


def save(name, text, state):
    (FIXTURES / f"{name}.qasm").write_text(text.rstrip() + "\n")
    np.savetxt(FIXTURES / f"{name}.state", np.column_stack((state.real, state.imag)), fmt="%.17g")


def generate():
    FIXTURES.mkdir(parents=True, exist_ok=True)
    circuit = QuantumCircuit(3)
    circuit.h(0)
    circuit.x(2)
    circuit.ry(0.37, 1)
    circuit.cx(0, 2)
    circuit.rx(-0.42, 0)
    circuit.rz(0.61, 2)
    circuit.cy(2, 1)
    circuit.cz(0, 2)
    circuit.swap(0, 1)
    circuit.ccx(2, 0, 1)
    circuit.cswap(1, 0, 2)
    circuit.s(2)
    circuit.t(0)
    circuit.sdg(1)
    circuit.tdg(2)
    circuit.append(U1Gate(0.28), [1])
    circuit.append(U3Gate(0.2, -0.3, 0.4), [2])
    save("qiskit-unitary", qasm2.dumps(circuit), msb_state(Statevector.from_instruction(circuit).data))

    qubits = cirq.LineQubit.range(3)
    circuit = cirq.Circuit(
        cirq.H(qubits[0]), cirq.X(qubits[2]), cirq.ry(0.37)(qubits[1]),
        cirq.CNOT(qubits[0], qubits[2]), cirq.rx(-0.42)(qubits[0]),
        cirq.rz(0.61)(qubits[2]), cirq.CZ(qubits[0], qubits[1]),
        cirq.SWAP(qubits[0], qubits[2]), cirq.TOFFOLI(qubits[2], qubits[0], qubits[1]),
        cirq.FREDKIN(qubits[1], qubits[2], qubits[0]), cirq.S(qubits[1]), cirq.T(qubits[2]),
    )
    text = str(cirq.QasmOutput(circuit.all_operations(), qubits=qubits, precision=17))
    state = cirq.Simulator(dtype=np.complex128).simulate(circuit, qubit_order=qubits).final_state_vector
    save("cirq-unitary", text, state)
    (FIXTURES / "versions.txt").write_text(f"qiskit=={qiskit.__version__}\ncirq-core=={cirq.__version__}\n")
    print("Generated Qiskit and Cirq fixtures with independent state-vector references.")


def verify():
    files = sorted(EXPORTS.glob("*.qasm"))
    if {path.stem for path in files} != {"qiskit-unitary", "cirq-unitary", "dynamic"}:
        raise RuntimeError("Expected three jqapi exports; run mvn clean test first")
    for path in files:
        circuit = qasm2.loads(path.read_text(), strict=True)
        state_path = path.with_suffix(".state")
        if state_path.exists():
            pairs = np.loadtxt(state_path)
            expected = pairs[:, 0] + 1j * pairs[:, 1]
            actual = msb_state(Statevector.from_instruction(circuit).data)
            overlap = np.vdot(expected, actual)
            assert abs(abs(overlap) - 1) < 1e-9, path
            np.testing.assert_allclose(actual, expected * overlap / abs(overlap), atol=1e-9, rtol=0)
        print(f"PASS strict external parser / state check: {path.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate", action="store_true")
    args = parser.parse_args()
    if args.generate:
        generate()
    else:
        verify()
