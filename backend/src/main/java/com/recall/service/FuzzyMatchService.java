package com.recall.service;

import com.recall.config.RecallProperties;
import com.recall.datastructure.SignatureBST;
import com.recall.datastructure.SignatureNode;
import com.recall.datastructure.SignatureSimilarity;
import org.springframework.stereotype.Service;

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

    public int commonPrefixLength(String firstSignature, String secondSignature) {
        return SignatureSimilarity.commonPrefixLength(firstSignature, secondSignature);
    }

    public synchronized void clear() {
        tree.clear();
    }
}
