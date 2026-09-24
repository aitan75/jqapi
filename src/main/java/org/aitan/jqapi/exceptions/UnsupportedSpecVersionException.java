package org.aitan.jqapi.exceptions;

/** A well-formed version number that this backend cannot interpret. */
public final class UnsupportedSpecVersionException extends IllegalArgumentException {
    public UnsupportedSpecVersionException(int version) {
        super("Unsupported spec version: " + version);
    }
}
