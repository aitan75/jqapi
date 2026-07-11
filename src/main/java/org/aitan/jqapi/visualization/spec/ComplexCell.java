package org.aitan.jqapi.visualization.spec;

/**
 * A single complex matrix entry in the serializable circuit representation,
 * carried as primitive doubles so the on-disk format never depends on the
 * runtime {@code Complex} type.
 *
 * @author Gaetano Ferrara
 */
public record ComplexCell(double re, double im) {
}
