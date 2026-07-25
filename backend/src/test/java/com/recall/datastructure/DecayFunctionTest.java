package com.recall.datastructure;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Plain unit tests — no Spring context. */
class DecayFunctionTest {

    private static final double DELTA = 1e-9;

    @Test
    @DisplayName("decayFactor: day 0 is 1.0 (no penalty for a success today)")
    void decayFactorAtDayZero() {
        assertEquals(1.0, DecayFunction.decayFactor(0.05, 0.0), DELTA);
        assertEquals(1.0, DecayFunction.decayFactor(0.5, 0.0), DELTA);
        assertEquals(1.0, DecayFunction.decayFactor(5.0, 0.0), DELTA);
    }

    @Test
    @DisplayName("decayFactor: exponential falloff at known day offsets")
    void decayFactorKnownOffsets() {
        // lambda 0.05 over a fortnight -> exp(-0.7) ~= 0.4966
        assertEquals(Math.exp(-0.7), DecayFunction.decayFactor(0.05, 14), DELTA);
        assertEquals(0.4965853, DecayFunction.decayFactor(0.05, 14), 1e-6);

        assertEquals(Math.exp(-0.05), DecayFunction.decayFactor(0.05, 1), DELTA);
        assertEquals(Math.exp(-1.5), DecayFunction.decayFactor(0.05, 30), DELTA);
        assertEquals(Math.exp(-0.35), DecayFunction.decayFactor(0.05, 7), DELTA);

        // The half-life of lambda = 0.05 is ln(2)/0.05 ~= 13.86 days.
        assertEquals(0.5, DecayFunction.decayFactor(0.05, Math.log(2) / 0.05), DELTA);

        // Fractional days are supported (half a day).
        assertEquals(Math.exp(-0.025), DecayFunction.decayFactor(0.05, 0.5), DELTA);
    }

    @Test
    @DisplayName("decayFactor decreases monotonically as days increase")
    void decayFactorMonotonicallyDecreases() {
        double lambda = 0.05;
        double previous = DecayFunction.decayFactor(lambda, 0);
        assertEquals(1.0, previous, DELTA);
        for (int days = 1; days <= 365; days++) {
            double current = DecayFunction.decayFactor(lambda, days);
            assertTrue(current < previous,
                    "decay at day " + days + " (" + current + ") should be below " + previous);
            assertTrue(current > 0.0 && current <= 1.0, "factor must stay within (0, 1]");
            previous = current;
        }
    }

    @Test
    @DisplayName("lambda = 0 disables decay entirely")
    void lambdaZeroNeverDecays() {
        for (double days : new double[]{0, 1, 14, 100, 10_000}) {
            assertEquals(1.0, DecayFunction.decayFactor(0.0, days), DELTA,
                    "lambda 0 must be flat at day " + days);
        }
    }

    @Test
    @DisplayName("negative day counts are clamped to 1.0 (a future date cannot inflate a score)")
    void negativeDaysClamped() {
        assertEquals(1.0, DecayFunction.decayFactor(0.05, -1), DELTA);
        assertEquals(1.0, DecayFunction.decayFactor(0.05, -500), DELTA);
        assertEquals(1.0, DecayFunction.decayFactor(2.0, -0.001), DELTA);
    }

    @Test
    @DisplayName("a larger lambda decays faster at the same day offset")
    void largerLambdaDecaysFaster() {
        assertTrue(DecayFunction.decayFactor(0.5, 14) < DecayFunction.decayFactor(0.05, 14));
        assertTrue(DecayFunction.decayFactor(0.05, 14) < DecayFunction.decayFactor(0.005, 14));
    }

    @Test
    @DisplayName("successRate guards against zero attempts")
    void successRateZeroAttemptGuard() {
        assertEquals(0.0, DecayFunction.successRate(0, 0), DELTA);
        assertEquals(1.0, DecayFunction.successRate(1, 0), DELTA);
        assertEquals(0.0, DecayFunction.successRate(0, 1), DELTA);
        assertEquals(0.75, DecayFunction.successRate(3, 1), DELTA);
        assertEquals(0.5, DecayFunction.successRate(5, 5), DELTA);
        assertEquals(1.0 / 3.0, DecayFunction.successRate(1, 2), DELTA);
    }

    @Test
    @DisplayName("usageFrequency saturates at the configured attempt count")
    void usageFrequencySaturation() {
        assertEquals(0.0, DecayFunction.usageFrequency(0, 10.0), DELTA);
        assertEquals(0.3, DecayFunction.usageFrequency(3, 10.0), DELTA);
        assertEquals(1.0, DecayFunction.usageFrequency(10, 10.0), DELTA);
        assertEquals(1.0, DecayFunction.usageFrequency(11, 10.0), DELTA, "clamped at 1.0");
        assertEquals(1.0, DecayFunction.usageFrequency(10_000, 10.0), DELTA);

        // Monotonic up to saturation, flat after.
        double previous = -1;
        for (int usage = 0; usage <= 10; usage++) {
            double current = DecayFunction.usageFrequency(usage, 10.0);
            assertTrue(current > previous);
            previous = current;
        }

        // Degenerate saturation collapses to a used/unused indicator.
        assertEquals(0.0, DecayFunction.usageFrequency(0, 0.0), DELTA);
        assertEquals(1.0, DecayFunction.usageFrequency(1, 0.0), DELTA);
        assertEquals(1.0, DecayFunction.usageFrequency(4, -3.0), DELTA);
    }

    @Test
    @DisplayName("normaliseFeedback maps 0..5 onto 0..1 and clamps out-of-range input")
    void normaliseFeedback() {
        assertEquals(0.0, DecayFunction.normaliseFeedback(0.0), DELTA);
        assertEquals(0.5, DecayFunction.normaliseFeedback(2.5), DELTA);
        assertEquals(0.8, DecayFunction.normaliseFeedback(4.0), DELTA);
        assertEquals(1.0, DecayFunction.normaliseFeedback(5.0), DELTA);
        assertEquals(1.0, DecayFunction.normaliseFeedback(9.0), DELTA);
        assertEquals(0.0, DecayFunction.normaliseFeedback(-2.0), DELTA);
    }

    @Test
    @DisplayName("weightedScore arithmetic matches a hand-computed value")
    void weightedScoreHandComputed() {
        // successRate 0.75, usage 0.4, feedback 0.8 with the default weights:
        //   base = 0.75*0.5 + 0.4*0.3 + 0.8*0.2
        //        = 0.375   + 0.12    + 0.16    = 0.655
        // decay at lambda 0.05 / 14 days = exp(-0.7) = 0.49658530...
        //   score = 0.655 * 0.49658530 = 0.3252633739...
        double decay = DecayFunction.decayFactor(0.05, 14);
        double score = DecayFunction.weightedScore(0.75, 0.4, 0.8, 0.5, 0.3, 0.2, decay);

        assertEquals(0.655 * Math.exp(-0.7), score, DELTA);
        assertEquals(0.3252633740, score, 1e-9);
    }

    @Test
    @DisplayName("weightedScore edge cases: no decay, full decay, all-zero terms")
    void weightedScoreEdges() {
        // Fresh, perfect on every term with weights summing to 1 -> exactly 1.0.
        assertEquals(1.0,
                DecayFunction.weightedScore(1.0, 1.0, 1.0, 0.5, 0.3, 0.2, 1.0), DELTA);
        // Decay factor of 0 zeroes even a perfect record.
        assertEquals(0.0,
                DecayFunction.weightedScore(1.0, 1.0, 1.0, 0.5, 0.3, 0.2, 0.0), DELTA);
        // Nothing achieved -> 0 regardless of freshness.
        assertEquals(0.0,
                DecayFunction.weightedScore(0.0, 0.0, 0.0, 0.5, 0.3, 0.2, 1.0), DELTA);
        // Weight isolation: only the success term counts when w2 = w3 = 0.
        assertEquals(0.4,
                DecayFunction.weightedScore(0.8, 1.0, 1.0, 0.5, 0.0, 0.0, 1.0), DELTA);
    }

    @Test
    @DisplayName("end-to-end: the full pipeline composes into the documented formula")
    void endToEndComposition() {
        int successes = 8;
        int failures = 2;
        double rating = 4.5;
        int usage = successes + failures;

        double sr = DecayFunction.successRate(successes, failures);          // 0.8
        double uf = DecayFunction.usageFrequency(usage, 10.0);               // 1.0
        double fb = DecayFunction.normaliseFeedback(rating);                 // 0.9
        double decay = DecayFunction.decayFactor(0.05, 2);                   // exp(-0.1)

        assertEquals(0.8, sr, DELTA);
        assertEquals(1.0, uf, DELTA);
        assertEquals(0.9, fb, DELTA);

        // base = 0.4 + 0.3 + 0.18 = 0.88
        double score = DecayFunction.weightedScore(sr, uf, fb, 0.5, 0.3, 0.2, decay);
        assertEquals(0.88 * Math.exp(-0.1), score, DELTA);
        assertTrue(score > 0 && score < 1);
    }
}
