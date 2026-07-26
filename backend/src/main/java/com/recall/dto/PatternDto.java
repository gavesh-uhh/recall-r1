package com.recall.dto;

import java.util.List;

/** A cross-project error cluster surfaced by connected-components analysis. */
public record PatternDto(
        String tag,
        int projectCount,
        int occurrenceCount,
        List<PatternExampleDto> examples
) {
}
