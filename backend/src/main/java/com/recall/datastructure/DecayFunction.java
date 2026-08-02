package com.recall.datastructure;

public final class DecayFunction {

    private DecayFunction() {
    }

    public static double decayFactor(double lambda, double daysSinceLastSuccess) {
        double days = Math.max(0.0, daysSinceLastSuccess);
        return Math.exp(-lambda * days);
    }

    public static double successRate(int successCount, int failureCount) {
        int total = successCount + failureCount;
        return total == 0 ? 0.0 : (double) successCount / total;
    }

    public static double usageFrequency(int usageCount, double saturation) {
        if (saturation <= 0) {
            return usageCount > 0 ? 1.0 : 0.0;
        }
        return Math.min(1.0, usageCount / saturation);
    }

    public static double weightedScore(double successRate,
                                       double usageFrequency,
                                       double normalisedFeedback,
                                       double successWeight,
                                       double usageWeight,
                                       double feedbackWeight,
                                       double decayFactor) {
        double base = successRate * successWeight
                + usageFrequency * usageWeight
                + normalisedFeedback * feedbackWeight;
        return base * decayFactor;
    }

    public static double normaliseFeedback(double feedbackScore) {
        return Math.max(0.0, Math.min(1.0, feedbackScore / 5.0));
    }
}
