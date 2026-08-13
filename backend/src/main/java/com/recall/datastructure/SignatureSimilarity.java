package com.recall.datastructure;

/**
 * Common-prefix character comparison utility for BST-based fuzzy signature matching.
 */
public final class SignatureSimilarity {

    private SignatureSimilarity() {
    }


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


    public static boolean isPrefixMatch(String a, String b, int prefixThreshold) {
        return commonPrefixLength(a, b) >= prefixThreshold;
    }
}
