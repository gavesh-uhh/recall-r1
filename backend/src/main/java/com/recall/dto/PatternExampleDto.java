package com.recall.dto;

/** Lightweight ErrorRecord projection used inside {@link PatternDto}. */
public record PatternExampleDto(
        Long id,
        String signature,
        String message,
        String project,
        String language
) {
}
