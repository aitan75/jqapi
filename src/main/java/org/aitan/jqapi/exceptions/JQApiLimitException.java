package org.aitan.jqapi.exceptions;

/**
 * Thrown when a requested size or limit violates the configured JQAPI bounds
 * (e.g. a non-positive size, or a qubit count exceeding the maximum allowed by
 * the active {@link org.aitan.jqapi.JQAPIConfig}).
 * <p>
 * Unchecked so it can guard constructors and factory methods without polluting
 * their signatures with checked-exception declarations.
 *
 * @author Gaetano Ferrara
 */
public class JQApiLimitException extends IllegalArgumentException {

    private static final long serialVersionUID = 1L;

    public JQApiLimitException(String message) {
        super(message);
    }

}
