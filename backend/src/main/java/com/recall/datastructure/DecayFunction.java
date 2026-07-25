package com.recall.datastructure;

/**
 * Pure scoring maths shared by {@link MaxHeap} and the solution-ranking service.
 * No Spring dependencies — weights and lambda are passed in by the caller.
 */
public final class DecayFunction {

    private DecayFunction() {
    }

    /**
     * {@code exp(-lambda * days)}. Days is clamped at zero so a future-dated
     * last-success cannot inflate a score above 1.0.
     */
    public static double decayFactor(double lambda, double daysSinceLastSuccess) {
        double days = Math.max(0.0, daysSinceLastSuccess);
        return Math.exp(-lambda * days);
    }

    /** Successes over total attempts; a never-tried solution scores 0. */
    public static double successRate(int successCount, int failureCount) {
        int total = successCount + failureCount;
        return total == 0 ? 0.0 : (double) successCount / total;
    }

    /**
     * Maps a raw usage count onto 0..1, saturating at {@code saturation} attempts, so the
     * frequency term stays commensurate with the other normalised terms.
     */
    public static double usageFrequency(int usageCount, double saturation) {
        if (saturation <= 0) {
            return usageCount > 0 ? 1.0 : 0.0;
        }
        return Math.min(1.0, usageCount / saturation);
    }

    /**
     * {@code (successRate*w1 + usageFrequency*w2 + normalisedFeedback*w3) * decayFactor}.
     * Feedback is supplied already normalised to 0..1 by the caller.
     */
    public static double weightedScore(double successRate,
                                       double usageFrequency,
                                       double normalisedFeedback,
                                       double w1, double w2, double w3,
                                       double decayFactor) {
        double base = successRate * w1 + usageFrequency * w2 + normalisedFeedback * w3;
        return base * decayFactor;
    }

    /** Ratings are captured on a 0..5 scale; the heap needs them on 0..1. */
    public static double normaliseFeedback(double feedbackScore) {
        return Math.max(0.0, Math.min(1.0, feedbackScore / 5.0));
    }
}
