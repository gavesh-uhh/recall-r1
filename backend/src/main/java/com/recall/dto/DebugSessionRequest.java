package com.recall.dto;

import java.time.LocalDateTime;

/** Body of {@code POST /api/sessions}. {@code errorId} may be null for an unattached session. */
public record DebugSessionRequest(
        Long errorId,
        String project,
        String actionsPerformed,
        LocalDateTime sessionDate,
        String feedback
) {
}
