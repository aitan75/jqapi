package org.aitan.jqapi.visualization.openqasm;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;

/** Bounded OpenQASM 2 importer. See docs/api/openqasm.md for the supported subset. */
public final class OpenQasmParser {
    public static final int MAX_SOURCE_LENGTH = 1_000_000;
    public static final int MAX_OPERATIONS = 10_000;
    public static final int MAX_EXPRESSION_DEPTH = 64;
    private static final int MAX_TOKEN_LENGTH = 256;
    private static final Pattern TOKEN = Pattern.compile(
            "(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?"
            + "|[a-zA-Z][a-zA-Z0-9_]*|\"[^\"\\r\\n]*\"|->|==|[;(),\\[\\]+*/^=-]");
    private static final Set<String> RESERVED = Set.of("qreg", "creg", "include", "if", "barrier", "gate",
            "opaque", "measure", "reset", "pi", "sin", "cos", "tan", "exp", "ln", "sqrt");

    private final String source;
    private final JQAPIConfig config;
    private final Map<String, Register> quantum = new HashMap<>();
    private final Map<String, Register> classical = new HashMap<>();
    private final List<LevelSpec> levels = new ArrayList<>();
    private int qubits;
    private int bits;
    private int cursor;
    private int tokenStart;
    private String token;
    private boolean qelib;

    private record Register(int offset, int size) { }
    private record Argument(List<Integer> indexes, boolean wholeRegister) { }

    private OpenQasmParser(String source, JQAPIConfig config) {
        this.source = Objects.requireNonNull(source, "source");
        this.config = Objects.requireNonNull(config, "config");
        if (source.length() > MAX_SOURCE_LENGTH) throw new JQApiLimitException("OpenQASM source exceeds character limit");
        next();
    }

    public static CircuitSpec parse(String source) {
        return parse(source, JQAPIConfig.getDefault());
    }

    /** Parses without allocating a state vector, using the supplied quantum/classical bit budget. */
    public static CircuitSpec parse(String source, JQAPIConfig config) {
        return new OpenQasmParser(source, config).program();
    }

    private CircuitSpec program() {
        expect("OPENQASM");
        expect("2.0");
        expect(";");
        while (!token.isEmpty()) {
            switch (token) {
                case "include" -> {
                    next();
                    expect("\"qelib1.inc\"");
                    expect(";");
                    if (qelib) throw error("Duplicate qelib1.inc include");
                    qelib = true;
                }
                case "qreg", "creg" -> declaration();
                case "barrier" -> {
                    next();
                    arguments(quantum);
                    expect(";");
                    // Operations retain source order; no optimizer crosses this boundary.
                }
                case "if" -> conditional();
                case "gate", "opaque" -> throw error("Custom gate definitions are not supported");
                default -> operation(null);
            }
        }
        if (qubits == 0) throw error("At least one quantum register is required");
        return CircuitSpec.of(qubits, levels, bits);
    }

    private void declaration() {
        boolean isQuantum = take("qreg");
        if (!isQuantum) expect("creg");
        String name = identifier();
        if (RESERVED.contains(name) || quantum.containsKey(name) || classical.containsKey(name)) {
            throw error("Reserved or duplicate register name: " + name);
        }
        expect("[");
        int size = integer();
        expect("]");
        expect(";");
        int offset = isQuantum ? qubits : bits;
        if (size < 1 || size > config.maxQubits() - offset) {
            throw new JQApiLimitException("Register size exceeds configured budget or is not positive: " + size);
        }
        (isQuantum ? quantum : classical).put(name, new Register(offset, size));
        if (isQuantum) qubits += size;
        else bits += size;
    }

    private void conditional() {
        expect("if");
        expect("(");
        String name = identifier();
        Register register = classical.get(name);
        if (register == null) throw error("Unknown classical register: " + name);
        if (register.size() != 1) throw error("Only one-bit classical registers are supported in if; split the register");
        expect("==");
        int expected = integer();
        if (expected > 1) throw error("A one-bit if condition must compare to 0 or 1");
        expect(")");
        operation(new Condition(register.offset(), expected));
    }

    private void operation(Condition condition) {
        String name = token;
        next();
        OpenQasmGates.Mapping mapping;
        try {
            mapping = OpenQasmGates.named(name);
        } catch (IllegalArgumentException ex) {
            throw error(ex.getMessage());
        }
        if (!qelib && !Set.of("U", "CX", "measure", "reset").contains(name)) {
            throw error("Gate " + name + " requires include \"qelib1.inc\"");
        }
        if (condition != null && (mapping.kind() == GateKind.MEASUREMENT || mapping.kind() == GateKind.RESET)) {
            throw error("Conditional measurement/reset is not supported by CircuitSpec");
        }
        var values = new ArrayList<Double>();
        if (take("(")) {
            if (!token.equals(")")) {
                do {
                    if (values.size() == 3) throw error("At most three gate parameters are supported");
                    values.add(expression(0, 0));
                } while (take(","));
            }
            expect(")");
        }
        Map<String, Double> params;
        try {
            params = OpenQasmGates.parameters(name, mapping, values);
        } catch (IllegalArgumentException ex) {
            throw error(ex.getMessage());
        }
        List<Argument> arguments = arguments(quantum);
        if (arguments.size() != mapping.controls() + mapping.targets()) throw error("Wrong operand count for " + name);
        Argument destination = null;
        if (mapping.kind() == GateKind.MEASUREMENT) {
            expect("->");
            destination = argument(classical);
            if (arguments.getFirst().indexes().size() != destination.indexes().size()
                    || arguments.getFirst().wholeRegister() != destination.wholeRegister()) {
                throw error("Measurement operands must be matching bits or equal-sized registers");
            }
        }
        expect(";");
        int width = 0;
        for (Argument argument : arguments) {
            if (argument.wholeRegister()) {
                int size = argument.indexes().size();
                if (width != 0 && width != size) throw error("Register operands must have equal sizes");
                width = size;
            }
        }
        width = Math.max(1, width);
        for (int i = 0; i < width; i++) {
            var operands = new ArrayList<Integer>();
            for (Argument argument : arguments) {
                operands.add(argument.indexes().get(argument.wholeRegister() ? i : 0));
            }
            if (new HashSet<>(operands).size() != operands.size()) throw error("Gate operands must be distinct");
            if (levels.size() >= MAX_OPERATIONS) throw new JQApiLimitException("OpenQASM operation limit exceeded");
            var gate = new GateSpec(mapping.kind(), operands.subList(mapping.controls(), operands.size()),
                    operands.subList(0, mapping.controls()), params, null,
                    destination == null ? null : destination.indexes().get(i), condition);
            levels.add(new LevelSpec(List.of(gate)));
        }
    }

    private List<Argument> arguments(Map<String, Register> registers) {
        var result = new ArrayList<Argument>();
        do {
            if (result.size() >= JQAPIConfig.ABSOLUTE_MAX_QUBITS) throw error("Too many operands");
            result.add(argument(registers));
        } while (take(","));
        return result;
    }

    private Argument argument(Map<String, Register> registers) {
        String name = identifier();
        Register register = registers.get(name);
        if (register == null) throw error("Unknown register: " + name);
        if (take("[")) {
            int index = integer();
            expect("]");
            if (index >= register.size()) throw error("Index outside register " + name + ": " + index);
            return new Argument(List.of(register.offset() + index), false);
        }
        var indexes = new ArrayList<Integer>();
        for (int i = 0; i < register.size(); i++) indexes.add(register.offset() + i);
        return new Argument(indexes, true);
    }

    private double expression(int minimumPrecedence, int depth) {
        if (depth >= MAX_EXPRESSION_DEPTH) throw new JQApiLimitException("OpenQASM expression nesting limit exceeded");
        double value;
        if (take("-")) value = -expression(3, depth + 1);
        else if (take("(")) {
            value = expression(0, depth + 1);
            expect(")");
        } else if (take("pi")) value = Math.PI;
        else if (Set.of("sin", "cos", "tan", "exp", "ln", "sqrt").contains(token)) {
            String function = token;
            next();
            expect("(");
            double argument = expression(0, depth + 1);
            expect(")");
            value = switch (function) {
                case "sin" -> Math.sin(argument);
                case "cos" -> Math.cos(argument);
                case "tan" -> Math.tan(argument);
                case "exp" -> Math.exp(argument);
                case "ln" -> Math.log(argument);
                default -> Math.sqrt(argument);
            };
        } else {
            try {
                if (token.isEmpty() || (!Character.isDigit(token.charAt(0)) && token.charAt(0) != '.')) {
                    throw error("Expected a numeric parameter expression");
                }
                value = Double.parseDouble(token);
            } catch (NumberFormatException ex) {
                throw error("Invalid numeric parameter");
            }
            next();
        }
        while (true) {
            String operator = token;
            int precedence = switch (operator) {
                case "+", "-" -> 1;
                case "*", "/" -> 2;
                case "^" -> 3;
                default -> -1;
            };
            if (precedence < minimumPrecedence) break;
            next();
            double right = expression(operator.equals("^") ? precedence : precedence + 1, depth + 1);
            value = switch (operator) {
                case "+" -> value + right;
                case "-" -> value - right;
                case "*" -> value * right;
                case "/" -> value / right;
                default -> Math.pow(value, right);
            };
        }
        if (!Double.isFinite(value)) throw error("Parameter expression must evaluate to a finite number");
        return value;
    }

    private String identifier() {
        if (!token.matches("[a-z][a-zA-Z0-9_]*")) throw error("Expected a register identifier");
        String result = token;
        next();
        return result;
    }

    private int integer() {
        if (!token.matches("0|[1-9][0-9]*")) throw error("Expected a non-negative integer");
        try {
            int result = Integer.parseInt(token);
            next();
            return result;
        } catch (NumberFormatException ex) {
            throw error("Integer exceeds supported range");
        }
    }

    private boolean take(String expected) {
        if (!token.equals(expected)) return false;
        next();
        return true;
    }

    private void expect(String expected) {
        if (!take(expected)) throw error("Expected '" + expected + "', found '" + token + "'");
    }

    private void next() {
        while (cursor < source.length()) {
            if (Character.isWhitespace(source.charAt(cursor))) cursor++;
            else if (source.startsWith("//", cursor)) {
                while (cursor < source.length() && source.charAt(cursor) != '\n' && source.charAt(cursor) != '\r') cursor++;
            } else break;
        }
        tokenStart = cursor;
        if (cursor == source.length()) {
            token = "";
            return;
        }
        var matcher = TOKEN.matcher(source).region(cursor, source.length());
        if (!matcher.lookingAt()) throw error("Unexpected character '" + source.charAt(cursor) + "'");
        if (matcher.end() - cursor > MAX_TOKEN_LENGTH) throw new JQApiLimitException("OpenQASM token length limit exceeded");
        token = matcher.group();
        cursor = matcher.end();
    }

    private IllegalArgumentException error(String message) {
        int line = 1;
        int column = 1;
        for (int i = 0; i < tokenStart; i++) {
            if (source.charAt(i) == '\n') { line++; column = 1; }
            else column++;
        }
        return new IllegalArgumentException("OpenQASM line " + line + ", column " + column + ": " + message);
    }
}
