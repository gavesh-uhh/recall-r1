package com.recall.dto;

/**
 * Body of {@code PATCH /api/solutions/{id}/feedback}.
 * {@code rating} is optional (0..5); when absent only the success/failure counters move.
 */
public record FeedbackRequest(Boolean success, Double rating) {
}
