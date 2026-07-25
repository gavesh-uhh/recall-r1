package com.recall.dto;

import java.time.LocalDateTime;

/** A solution plus the heap-computed score that determined its rank. */
public record RankedSolutionDto(
        Long id,
        Long errorRecordId,
        String description,
        int successCount,
        int failureCount,
        LocalDateTime lastSuccessDate,
        double feedbackScore,
        double decayScore
) {
}
