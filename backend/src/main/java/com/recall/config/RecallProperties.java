package com.recall.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Tunables backing the decay function, heap scoring, and graph auto-linking. */
@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "recall")
public class RecallProperties {

    private final Decay decay = new Decay();
    private final Heap heap = new Heap();
    private final Graph graph = new Graph();

    public Decay getDecay() { return decay; }
    public Heap getHeap() { return heap; }
    public Graph getGraph() { return graph; }

    public static class Decay {
        /** Exponential decay rate per day since last success. */
        private double lambda = 0.05;

        public double getLambda() { return lambda; }
        public void setLambda(double lambda) { this.lambda = lambda; }
    }

    public static class Heap {
        private final Weights weights = new Weights();
        /** Usage count that saturates the frequency term at 1.0. */
        private double frequencySaturation = 10.0;

        public Weights getWeights() { return weights; }

        public double getFrequencySaturation() { return frequencySaturation; }
        public void setFrequencySaturation(double frequencySaturation) {
            this.frequencySaturation = frequencySaturation;
        }

        public static class Weights {
            private double w1 = 0.5;
            private double w2 = 0.3;
            private double w3 = 0.2;

            public double getW1() { return w1; }
            public void setW1(double w1) { this.w1 = w1; }

            public double getW2() { return w2; }
            public void setW2(double w2) { this.w2 = w2; }

            public double getW3() { return w3; }
            public void setW3(double w3) { this.w3 = w3; }
        }
    }

    public static class Graph {
        /**
         * Minimum common-prefix character count required to auto-link signatures in BST neighbor matching.
         * Default is 30 characters: long enough to prevent accidental cross-linking of distinct error types
         * while matching near-identical error headers and messages.
         */
        private int prefixThreshold = 30;

        public int getPrefixThreshold() { return prefixThreshold; }
        public void setPrefixThreshold(int prefixThreshold) { this.prefixThreshold = prefixThreshold; }
    }
}
