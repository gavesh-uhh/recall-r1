package com.recall.service;

/**
 * Result of attempting to match a new error signature against the BST signature index.
 */
public class MatchResult {

    private final boolean linked;
    private final Long errorId;

    private MatchResult(boolean linked, Long errorId) {
        this.linked = linked;
        this.errorId = errorId;
    }

    public static MatchResult linkedTo(Long existingErrorId) {
        return new MatchResult(true, existingErrorId);
    }

    public static MatchResult newError(Long newErrorId) {
        return new MatchResult(false, newErrorId);
    }

    public boolean isLinked() {
        return linked;
    }

    public Long getErrorId() {
        return errorId;
    }
}
