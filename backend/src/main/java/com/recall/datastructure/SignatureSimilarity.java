package com.recall.datastructure;

import com.recall.service.ParsedSignature;

public final class SignatureSimilarity {

    private SignatureSimilarity() {
    }

    public static int calculateSimilarity(ParsedSignature a, ParsedSignature b) {
        if (a == null || b == null) {
            return 0;
        }

        int score = 0;

        // Highest weight: Error Type (Exception class)
        if (a.getErrorType().equalsIgnoreCase(b.getErrorType())) {
            score += 40;
        }

        // High weight: Source Class
        if (!a.getSourceClass().equals("UNKNOWN") && a.getSourceClass().equalsIgnoreCase(b.getSourceClass())) {
            score += 30;
        }

        // Medium weight: Method
        if (!a.getMethod().equals("UNKNOWN") && a.getMethod().equalsIgnoreCase(b.getMethod())) {
            score += 15;
        }

        // Low weight: Normalized message (exact or substring)
        if (!a.getNormalizedMessage().isEmpty() && !b.getNormalizedMessage().isEmpty()) {
            if (a.getNormalizedMessage().equalsIgnoreCase(b.getNormalizedMessage())) {
                score += 15;
            } else if (a.getNormalizedMessage().contains(b.getNormalizedMessage()) || b.getNormalizedMessage().contains(a.getNormalizedMessage())) {
                score += 10;
            } else {
                // If they have some long common prefix in the message (at least 10 chars)
                int prefixLen = commonPrefixLength(a.getNormalizedMessage(), b.getNormalizedMessage());
                if (prefixLen >= 10) {
                    score += 5;
                }
            }
        }

        return score;
    }

    public static int calculateSimilarity(String searchableSignatureA, String searchableSignatureB) {
        if (searchableSignatureA != null && searchableSignatureA.equals(searchableSignatureB)) {
            return 100;
        }
        ParsedSignature sigA = ParsedSignature.fromSearchableString(searchableSignatureA);
        ParsedSignature sigB = ParsedSignature.fromSearchableString(searchableSignatureB);
        return calculateSimilarity(sigA, sigB);
    }

    public static boolean isMatch(String searchableSignatureA, String searchableSignatureB, int threshold) {
        return calculateSimilarity(searchableSignatureA, searchableSignatureB) >= threshold;
    }

    // Keep for message prefix calculation
    public static int commonPrefixLength(String a, String b) {
        if (a == null || b == null) {
            return 0;
        }
        int i = 0;
        while (i < a.length() && i < b.length() && a.charAt(i) == b.charAt(i)) {
            i++;
        }
        return i;
    }
}
