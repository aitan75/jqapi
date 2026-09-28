OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
cy q[2],q[0];
cz q[0],q[1];
cx q[1],q[2];
