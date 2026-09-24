package org.aitan.jqapi.quantum.classical;

import java.util.List;
import java.util.Objects;

/** Evaluates a condition against a snapshot, never against circuit metadata. */
public final class ConditionPredicate {
    private final Condition condition;
    public ConditionPredicate(Condition condition) {
        this.condition = Objects.requireNonNull(condition, "condition");
    }
    public boolean matches(List<ClassicalRecord> records) {
        Objects.requireNonNull(records, "records");
        if (condition.bitIndex() >= records.size()) throw new IllegalArgumentException("Classical bit is outside register");
        return records.get(condition.bitIndex()).bit() == condition.expected();
    }
}
