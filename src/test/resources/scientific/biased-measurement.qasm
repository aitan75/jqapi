OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
ry(pi/3) q[0];
x q[2];
measure q[0] -> c[2];
measure q[1] -> c[0];
measure q[2] -> c[1];
