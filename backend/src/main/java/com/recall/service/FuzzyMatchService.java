package com.recall.service;

import com.recall.config.RecallProperties;
import com.recall.datastructure.SignatureBST;
import com.recall.datastructure.SignatureNode;
import com.recall.datastructure.SignatureSimilarity;
import org.springframework.stereotype.Service;

/**
 * Service managing BST-based fuzzy signature matching using common prefix length.
 */
@Service
public class FuzzyMatchService {

    private final SignatureBST tree = new SignatureBST();
    private final RecallProperties recallProperties;

    public FuzzyMatchService(RecallProperties recallProperties) {
        this.recallProperties = recallProperties;
    }

    public synchronized SignatureBST getTree() {
        return tree;
    }

    /**
     * Processes a new error signature by finding predecessor/successor neighbors in the BST
     * and checking for a common prefix meeting the configured character count threshold.
     *
     * @param signature normalized signature string
     * @param errorId   error record ID
     * @return MatchResult indicating if linked to an existing error or inserted as new
     */
    public synchronized MatchResult processNewError(String signature, Long errorId) {
        if (signature == null || signature.isBlank()) {
            return MatchResult.newError(errorId);
        }

        int prefixThreshold = recallProperties.getGraph().getPrefixThreshold();
        SignatureNode[] neighbors = tree.findNeighbors(signature);

        for (SignatureNode neighbor : neighbors) {
            if (neighbor != null && !neighbor.errorId.equals(errorId) &&
                    commonPrefixLength(signature, neighbor.normalizedSignature) >= prefixThreshold) {
                return MatchResult.linkedTo(neighbor.errorId);
            }
        }

        tree.insert(signature, errorId);
        return MatchResult.newError(errorId);
    }

    public int commonPrefixLength(String a, String b) {
        return SignatureSimilarity.commonPrefixLength(a, b);
    }

    public synchronized void clear() {
        tree.clear();
    }
}
