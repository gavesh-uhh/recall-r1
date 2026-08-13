package com.recall.dto;

/**
 * Body of {@code POST /api/errors/{errorId}/solutions} — creates a genuinely new solution.
 *
 * <p>A new solution always starts with zero history ({@code successCount = failureCount = 0},
 * {@code feedbackScore = 0.0}, {@code ratingCount = 0}, {@code lastSuccessDate = null}).
 * History is earned only through {@code PATCH /api/solutions/{id}/feedback} after the fix has
 * actually been tried. Seeding solutions with pre-existing history belongs in sample/admin/test
 * tooling (see {@code SampleDataLoader}), never in this user-facing create flow.
 */
public record SolutionRequest(
        String description
) {
}
