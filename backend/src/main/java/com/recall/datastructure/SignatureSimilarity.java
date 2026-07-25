package com.recall.datastructure;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Fuzzy matching for error signatures — stack-trace headers, exception messages and the
 * like — with no external NLP dependency.
 *
 * <p>Two complementary measures are combined because they fail in opposite directions:
 * <ul>
 *   <li>{@link #jaccard} compares <em>bags of tokens</em>, so it survives reordered
 *       clauses, extra padding words, and differing punctuation
 *       ({@code "NullPointerException at Foo.bar"} vs
 *       {@code "at Foo.bar: NullPointerException thrown"}).</li>
 *   <li>{@link #levenshteinRatio} compares <em>characters</em>, so it catches typo-level
 *       drift and near-identical strings whose tokens differ slightly
 *       ({@code "Connectin refused"} vs {@code "Connection refused"}), which Jaccard
 *       would score harshly because the mistyped token simply does not match.</li>
 * </ul>
 * {@link #similarity} takes the max of the two: either kind of evidence is enough to link.
 */
public final class SignatureSimilarity {

    private SignatureSimilarity() {
    }

    /**
     * Lowercases and splits on any run of non-alphanumeric characters, then drops
     * <ul>
     *   <li>tokens shorter than 2 characters (noise: {@code a}, {@code i}, stray letters), and</li>
     *   <li>purely numeric tokens — these are almost always line numbers, ports, object
     *       hashes or generated ids, and matching on them creates false positives between
     *       otherwise unrelated errors.</li>
     * </ul>
     *
     * @return distinct tokens in first-seen order; empty set for null/blank input
     */
    public static Set<String> tokenize(String signature) {
        Set<String> tokens = new LinkedHashSet<>();
        if (signature == null || signature.isBlank()) {
            return tokens;
        }
        for (String raw : signature.toLowerCase().split("[^a-z0-9]+")) {
            if (raw.length() < 2) {
                continue;
            }
            if (isNumeric(raw)) {
                continue;
            }
            tokens.add(raw);
        }
        return tokens;
    }

    private static boolean isNumeric(String token) {
        for (int i = 0; i < token.length(); i++) {
            if (!Character.isDigit(token.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Token-set Jaccard index {@code |A ∩ B| / |A ∪ B|}.
     *
     * @return 0..1; 0.0 when either side tokenises to nothing (including null/blank input)
     */
    public static double jaccard(String a, String b) {
        Set<String> ta = tokenize(a);
        Set<String> tb = tokenize(b);
        if (ta.isEmpty() || tb.isEmpty()) {
            return 0.0;
        }
        int intersection = 0;
        for (String token : ta) {
            if (tb.contains(token)) {
                intersection++;
            }
        }
        int union = ta.size() + tb.size() - intersection;
        return union == 0 ? 0.0 : (double) intersection / union;
    }

    /**
     * Classic Levenshtein edit distance with the two-row DP optimisation (O(min(n,m)) space).
     * Nulls are treated as empty strings, so {@code levenshtein(null, "ab") == 2}.
     */
    public static int levenshtein(String a, String b) {
        String s = a == null ? "" : a;
        String t = b == null ? "" : b;
        if (s.equals(t)) {
            return 0;
        }
        if (s.isEmpty()) {
            return t.length();
        }
        if (t.isEmpty()) {
            return s.length();
        }

        int[] previous = new int[t.length() + 1];
        int[] current = new int[t.length() + 1];
        for (int j = 0; j <= t.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= s.length(); i++) {
            current[0] = i;
            char sc = s.charAt(i - 1);
            for (int j = 1; j <= t.length(); j++) {
                int substitutionCost = previous[j - 1] + (sc == t.charAt(j - 1) ? 0 : 1);
                int deletionCost = previous[j] + 1;
                int insertionCost = current[j - 1] + 1;
                current[j] = Math.min(substitutionCost, Math.min(deletionCost, insertionCost));
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[t.length()];
    }

    /**
     * Normalised edit distance: {@code 1 - distance / max(len(a), len(b))}.
     *
     * @return 0..1; 0.0 when both sides are empty/null (no evidence of similarity)
     */
    public static double levenshteinRatio(String a, String b) {
        String s = a == null ? "" : a;
        String t = b == null ? "" : b;
        int maxLen = Math.max(s.length(), t.length());
        if (maxLen == 0) {
            return 0.0;
        }
        double ratio = 1.0 - (double) levenshtein(s, t) / maxLen;
        return Math.max(0.0, Math.min(1.0, ratio));
    }

    /**
     * The value compared against {@code recall.graph.fuzzy-threshold} when deciding whether
     * to auto-link two errors: {@code max(jaccard, levenshteinRatio)}.
     *
     * <p>Taking the maximum rather than an average is deliberate — token overlap catches
     * reordered or padded messages, edit distance catches typo-level drift, and a strong
     * signal from either one is sufficient evidence of the same underlying error. Averaging
     * would let the weaker measure veto a confident match.
     */
    public static double similarity(String a, String b) {
        return Math.max(jaccard(a, b), levenshteinRatio(a, b));
    }
}
