package com.recall.service;

import com.recall.config.RecallProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FuzzyMatchServiceTest {

    private FuzzyMatchService fuzzyMatchService;

    @BeforeEach
    void setUp() {
        RecallProperties properties = new RecallProperties();
        properties.getGraph().setPrefixThreshold(60);
        fuzzyMatchService = new FuzzyMatchService(properties);
    }

    @Test
    void emptyTreeProcessNewError() {
        MatchResult result = fuzzyMatchService.processNewError("java.lang.NullPointerException:UNKNOWN:UNKNOWN:foo", 100L);
        assertFalse(result.isLinked(), "First insertion into empty tree should not be linked");
        assertEquals(100L, result.getErrorId());
    }

    @Test
    void prefixMatchLongPrefixLinked() {
        // First error
        String sig1 = "java.lang.NullPointerException:com.example.Foo:UNKNOWN:cannot invoke method on null reference";
        fuzzyMatchService.processNewError(sig1, 101L);

        // Second error sharing class and exception type (score = 40 + 30 + 15 = 85)
        String sig2 = "java.lang.NullPointerException:com.example.Foo:UNKNOWN:cannot invoke method on null reference";
        MatchResult result = fuzzyMatchService.processNewError(sig2, 102L);

        assertTrue(result.isLinked(), "Signatures sharing a long common prefix should be linked");
        assertEquals(101L, result.getErrorId(), "Should link to the existing error ID");
    }

    @Test
    void prefixMismatchShortPrefixNotLinked() {
        // First error
        String sig1 = "java.lang.NullPointerException:UNKNOWN:UNKNOWN:foo error";
        fuzzyMatchService.processNewError(sig1, 201L);

        // Second error - different exception, different message
        String sig2 = "java.lang.IllegalArgumentException:UNKNOWN:UNKNOWN:bar error";
        MatchResult result = fuzzyMatchService.processNewError(sig2, 202L);

        assertFalse(result.isLinked(), "Signatures sharing a short prefix below threshold should not be linked");
        assertEquals(202L, result.getErrorId(), "Should return the new error ID");
    }

    @Test
    void identicalSignatureMatchesTrivially() {
        String sig = "java.lang.RuntimeException:UNKNOWN:UNKNOWN:identical stack trace header";
        fuzzyMatchService.processNewError(sig, 301L);

        MatchResult result = fuzzyMatchService.processNewError(sig, 302L);
        assertTrue(result.isLinked(), "Identical signatures should match trivially");
        assertEquals(301L, result.getErrorId());
    }
}
