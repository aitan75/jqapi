"""Regenerate small, deterministic scientific references in an optional venv.

No shots are used: probabilities come from Qiskit's independent Statevector.
The checked-in values, not this Python environment, are consumed by Maven CI.
"""
import hashlib
import json
import platform
from importlib.metadata import version
from pathlib import Path

import numpy as np
from qiskit import QuantumCircuit, qasm2
from qiskit.quantum_info import Operator, Statevector

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "src/test/resources/scientific"


def msb_permutation(width):
    """jqapi index b0...bn maps to Qiskit index bn...b0 (q0 is LSB there)."""
    return [int(f"{index:0{width}b}"[::-1], 2) for index in range(1 << width)]


def save(name, circuit, operator=False, classical=False):
    permutation = msb_permutation(circuit.num_qubits)
    state = Statevector.from_instruction(circuit).data[permutation]
    np.savetxt(OUT / f"{name}.state", np.column_stack((state.real, state.imag)), fmt="%.17g")
    probabilities = np.abs(state) ** 2
    np.savetxt(OUT / f"{name}.probabilities", probabilities, fmt="%.17g")
    if operator:
        # BOTH axes must be permuted: column = input basis, row = output basis.
        matrix = Operator(circuit).data[np.ix_(permutation, permutation)].ravel()
        np.savetxt(OUT / f"{name}.operator", np.column_stack((matrix.real, matrix.imag)), fmt="%.17g")
    if classical:
        # q0 -> c2, q1 -> c0, q2 -> c1. Stored histogram is c0,c1,c2 MSB first.
        counts = np.zeros(8)
        for index, probability in enumerate(probabilities):
            q0, q1, q2 = (index >> 2) & 1, (index >> 1) & 1, index & 1
            counts[(q1 << 2) | (q2 << 1) | q0] += probability
        np.savetxt(OUT / f"{name}.classical-probabilities", counts, fmt="%.17g")
        circuit.measure([0, 1, 2], [2, 0, 1])
    (OUT / f"{name}.qasm").write_text(qasm2.dumps(circuit) + "\n", encoding="utf-8")


def main():
    versions = {package: version(package) for package in ("qiskit", "numpy")}
    if versions != {"qiskit": "2.5.2", "numpy": "2.5.3"}:
        raise RuntimeError("Install requirements-scientific.txt before regenerating")
    assert msb_permutation(3) == [0, 4, 2, 6, 1, 5, 3, 7]
    OUT.mkdir(parents=True, exist_ok=True)
    circuit = QuantumCircuit(3)
    circuit.h(0)
    circuit.ry(0.731, 1)
    circuit.rx(-0.419, 2)
    circuit.cx(2, 0)
    circuit.rz(1.137, 0)
    circuit.cy(0, 2)
    circuit.swap(1, 2)
    save("asymmetric-unitary", circuit)
    circuit = QuantumCircuit(3)
    circuit.cy(2, 0)
    circuit.cz(0, 1)
    circuit.cx(1, 2)
    save("controlled-operator", circuit, operator=True)
    circuit = QuantumCircuit(3, 3)
    circuit.ry(np.pi / 3, 0)
    circuit.x(2)
    save("biased-measurement", circuit, classical=True)
    metadata = {
        "generator": "src/test/python/scientific_references.py",
        "generator_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "python": platform.python_version(), "packages": versions,
        "backend": "qiskit.quantum_info.Statevector / Operator (complex128, no shots)",
        "ordering": "q0 MSB; bit-reverse Qiskit state indices and BOTH operator axes",
        "operator_layout": "row-major real imaginary; exact phase convention",
        "seed": None,
        "files_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                         for p in sorted(OUT.iterdir()) if p.suffix != ".json"},
    }
    (OUT / "manifest.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
