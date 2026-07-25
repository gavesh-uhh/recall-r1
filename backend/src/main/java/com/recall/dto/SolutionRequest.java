package com.recall.dto;

import java.time.LocalDateTime;

/**
 * Body of {@code POST /api/errors/{errorId}/solutions}. Counters are optional and
 * default to zero so a caller can seed a solution with existing history if it has any.
 */
public record SolutionRequest(
        String description,
        Integer successCount,
        Integer failureCount,
        LocalDateTime lastSuccessDate,
        Double feedbackScore
) {
}
