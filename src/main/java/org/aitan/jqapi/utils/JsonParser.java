package org.aitan.jqapi.utils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal, zero-dependency recursive-descent JSON parser producing a generic
 * tree ({@code Map}, {@code List}, {@code String}, {@code Double},
 * {@code Boolean}, {@code null}), plus typed accessors for that tree. Shared by
 * the core JSON formats and restricted to TeaVM-supported {@code java.*}.
 */
public final class JsonParser {

    private final String s;
    private final int maxDepth;
    private int pos;
    private int depth;

    private JsonParser(String s, int maxDepth) {
        this.s = s;
        this.maxDepth = maxDepth;
    }

    /**
     * @param json the JSON text
     * @param maxDepth maximum object/array nesting depth
     * @return the parsed tree
     * @throws IllegalArgumentException on malformed JSON or excessive nesting
     */
    public static Object parse(String json, int maxDepth) {
        return new JsonParser(json, maxDepth).parse();
    }

    /**
     * @param o parsed tree node
     * @param what field name used in the error message
     * @return the node as a JSON object
     * @throws IllegalArgumentException if the node is not an object
     */
    public static Map<String, Object> asObject(Object o, String what) {
        if (o instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> mm = (Map<String, Object>) m;
            return mm;
        }
        throw new IllegalArgumentException(what + " must be an object");
    }

    /** As {@link #asObject}, for arrays. @param o node @param what field name @return the array */
    public static List<Object> asArray(Object o, String what) {
        if (o instanceof List<?> l) {
            @SuppressWarnings("unchecked")
            List<Object> ll = (List<Object>) l;
            return ll;
        }
        throw new IllegalArgumentException(what + " must be an array");
    }

    /** As {@link #asObject}, for strings. @param o node @param what field name @return the string */
    public static String asString(Object o, String what) {
        if (o instanceof String s) {
            return s;
        }
        throw new IllegalArgumentException(what + " must be a string");
    }

    /** As {@link #asObject}, for finite numbers. @param o node @param what field name @return the number */
    public static double asDouble(Object o, String what) {
        if (o instanceof Double d) {
            if (!Double.isFinite(d)) {
                throw new IllegalArgumentException(what + " must be finite");
            }
            return d;
        }
        throw new IllegalArgumentException(what + " must be a number");
    }

    /** As {@link #asObject}, for integral numbers. @param o node @param what field name @return the integer */
    public static int asInt(Object o, String what) {
        double d = asDouble(o, what);
        if (d != Math.rint(d) || Math.abs(d) > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(what + " must be an integer");
        }
        return (int) d;
    }

    private Object parse() {
        Object v = parseValue();
        skipWs();
        if (pos != s.length()) {
            throw err("trailing characters");
        }
        return v;
    }

    private Object parseValue() {
        skipWs();
        if (pos >= s.length()) {
            throw err("unexpected end of input");
        }
        char c = s.charAt(pos);
        return switch (c) {
            case '{' -> parseObject();
            case '[' -> parseArray();
            case '"' -> parseString();
            case 't', 'f' -> parseBool();
            case 'n' -> parseNull();
            default -> parseNumber();
        };
    }

    private Map<String, Object> parseObject() {
        if (++depth > maxDepth) {
            throw err("nesting too deep");
        }
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            pos++; // consume '{'
            skipWs();
            if (peek() == '}') {
                pos++;
                return m;
            }
            while (true) {
                skipWs();
                String key = parseString();
                skipWs();
                expect(':');
                m.put(key, parseValue());
                skipWs();
                char c = nextChar();
                if (c == '}') {
                    return m;
                }
                if (c != ',') {
                    throw err("expected ',' or '}'");
                }
            }
        } finally {
            depth--;
        }
    }

    private List<Object> parseArray() {
        if (++depth > maxDepth) {
            throw err("nesting too deep");
        }
        try {
            List<Object> a = new ArrayList<>();
            pos++; // consume '['
            skipWs();
            if (peek() == ']') {
                pos++;
                return a;
            }
            while (true) {
                a.add(parseValue());
                skipWs();
                char c = nextChar();
                if (c == ']') {
                    return a;
                }
                if (c != ',') {
                    throw err("expected ',' or ']'");
                }
            }
        } finally {
            depth--;
        }
    }

    private String parseString() {
        expect('"');
        StringBuilder sb = new StringBuilder();
        while (true) {
            if (pos >= s.length()) {
                throw err("unterminated string");
            }
            char c = s.charAt(pos++);
            if (c == '"') {
                return sb.toString();
            }
            if (c == '\\') {
                if (pos >= s.length()) {
                    throw err("unterminated escape");
                }
                char e = s.charAt(pos++);
                switch (e) {
                    case '"' -> sb.append('"');
                    case '\\' -> sb.append('\\');
                    case '/' -> sb.append('/');
                    case 'n' -> sb.append('\n');
                    case 't' -> sb.append('\t');
                    case 'r' -> sb.append('\r');
                    case 'b' -> sb.append('\b');
                    case 'f' -> sb.append('\f');
                    case 'u' -> appendUnicodeEscape(sb);
                    default -> throw err("invalid escape '\\" + e + "'");
                }
            } else if (c < 0x20) {
                throw err("unescaped control character");
            } else if (Character.isHighSurrogate(c)) {
                //A raw high surrogate must be followed by a raw low surrogate;
                //an unpaired one is not a valid Unicode scalar value (RFC 8259 8.2).
                if (pos >= s.length() || !Character.isLowSurrogate(s.charAt(pos))) {
                    throw err("lone high surrogate character");
                }
                sb.append(c).append(s.charAt(pos++));
            } else if (Character.isLowSurrogate(c)) {
                throw err("lone low surrogate character");
            } else {
                sb.append(c);
            }
        }
    }

    /**
     * Reads and appends the body of a {@code \\uXXXX} escape (the leading
     * {@code \\u} has already been consumed). A high surrogate must be
     * immediately followed by an escaped low surrogate so the pair decodes to
     * a single Unicode scalar value; an unpaired surrogate is rejected because
     * RFC 8259 section 8.2 does not permit it.
     */
    private void appendUnicodeEscape(StringBuilder sb) {
        char ch = (char) readHexCodeUnit();
        if (Character.isHighSurrogate(ch)) {
            if (pos + 2 > s.length() || s.charAt(pos) != '\\' || s.charAt(pos + 1) != 'u') {
                throw err("lone high surrogate escape");
            }
            pos += 2;
            char low = (char) readHexCodeUnit();
            if (!Character.isLowSurrogate(low)) {
                throw err("high surrogate escape not followed by a low surrogate");
            }
            sb.append(ch).append(low);
        } else if (Character.isLowSurrogate(ch)) {
            throw err("lone low surrogate escape");
        } else {
            sb.append(ch);
        }
    }

    /**
     * Reads exactly four ASCII hexadecimal digits. Unlike
     * {@link Integer#parseInt(String, int)} this rejects sign prefixes and
     * any non-hex character, and unlike {@link Character#digit(char, int)}
     * it rejects non-ASCII Unicode digits.
     */
    private int readHexCodeUnit() {
        if (pos + 4 > s.length()) {
            throw err("truncated unicode escape");
        }
        int value = 0;
        for (int i = 0; i < 4; i++) {
            int digit = asciiHexDigit(s.charAt(pos + i));
            if (digit < 0) {
                throw err("invalid unicode escape");
            }
            value = (value << 4) | digit;
        }
        pos += 4;
        return value;
    }

    private static int asciiHexDigit(char c) {
        if (c >= '0' && c <= '9') {
            return c - '0';
        }
        if (c >= 'a' && c <= 'f') {
            return c - 'a' + 10;
        }
        if (c >= 'A' && c <= 'F') {
            return c - 'A' + 10;
        }
        return -1;
    }

    private Double parseNumber() {
        int start = pos;
        consume('-');
        if (!consume('0')) {
            requireDigits();
        }
        if (consume('.')) {
            requireDigits();
        }
        if (consume('e') || consume('E')) {
            if (!consume('+')) {
                consume('-');
            }
            requireDigits();
        }
        try {
            return Double.parseDouble(s.substring(start, pos));
        } catch (NumberFormatException nfe) {
            throw err("invalid number");
        }
    }

    private boolean consume(char c) {
        if (pos < s.length() && s.charAt(pos) == c) {
            pos++;
            return true;
        }
        return false;
    }

    private void requireDigits() {
        int start = pos;
        while (pos < s.length() && s.charAt(pos) >= '0' && s.charAt(pos) <= '9') {
            pos++;
        }
        if (pos == start) {
            throw err("expected digit");
        }
    }

    private Boolean parseBool() {
        if (s.startsWith("true", pos)) {
            pos += 4;
            return Boolean.TRUE;
        }
        if (s.startsWith("false", pos)) {
            pos += 5;
            return Boolean.FALSE;
        }
        throw err("invalid literal");
    }

    private Object parseNull() {
        if (s.startsWith("null", pos)) {
            pos += 4;
            return null;
        }
        throw err("invalid literal");
    }

    private void skipWs() {
        while (pos < s.length() && " \t\r\n".indexOf(s.charAt(pos)) >= 0) {
            pos++;
        }
    }

    private char peek() {
        skipWs();
        return pos < s.length() ? s.charAt(pos) : '\0';
    }

    private char nextChar() {
        if (pos >= s.length()) {
            throw err("unexpected end of input");
        }
        return s.charAt(pos++);
    }

    private void expect(char c) {
        skipWs();
        if (pos >= s.length() || s.charAt(pos) != c) {
            throw err("expected '" + c + "'");
        }
        pos++;
    }

    private IllegalArgumentException err(String msg) {
        return new IllegalArgumentException("Invalid JSON at position " + pos + ": " + msg);
    }
}
