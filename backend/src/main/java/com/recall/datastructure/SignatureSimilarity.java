package com.recall.datastructure;

/**
 * Common-prefix character comparison utility for BST-based fuzzy signature matching.
 */
public final class SignatureSimilarity {

    private SignatureSimilarity() {
    }

    /**
     * Calculates the length of the longest common prefix shared between two strings.
     *
     * @param a first string
     * @param b second string
     * @return character count of matching prefix, or 0 if either is null
     */
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

    /**
     * Checks if two strings share a common prefix of at least {@code prefixThreshold} characters.
     *
     * @param a               first string
     * @param b               second string
     * @param prefixThreshold minimum common prefix length required
     * @return true if common prefix length is at least prefixThreshold
     */
    public static boolean isPrefixMatch(String a, String b, int prefixThreshold) {
        return commonPrefixLength(a, b) >= prefixThreshold;
    }
}
