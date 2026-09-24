OPENQASM 2.0;
include "qelib1.inc";


// Qubits: [q(0), q(1), q(2)]
qreg q[3];


h q[0];
x q[2];
ry(pi*0.11777465788800255) q[1];
cx q[0],q[2];
rx(pi*-0.13369015219719207) q[0];
rz(pi*0.19416903057211232) q[2];
cz q[0],q[1];
swap q[0],q[2];
ccx q[2],q[0],q[1];
cswap q[1],q[2],q[0];
s q[1];
t q[2];
