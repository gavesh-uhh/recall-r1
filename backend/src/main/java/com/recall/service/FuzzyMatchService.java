package com.recall.service;

import com.recall.config.RecallProperties;
import com.recall.datastructure.SignatureBST;
import com.recall.datastructure.SignatureNode;
import com.recall.datastructure.SignatureSimilarity;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FuzzyMatchService {

    private final SignatureBST tree = new SignatureBST();
    private final Map<Long, MatchResult> history = new ConcurrentHashMap<>();
    private final RecallProperties recallProperties;

    public FuzzyMatchService(RecallProperties recallProperties) {
        this.recallProperties = recallProperties;
    }

    public synchronized SignatureBST getTree() {
        return tree;
    }

    public synchronized MatchResult processNewError(String signature, Long errorId) {
        if (signature == null || signature.isBlank()) {
            MatchResult res = MatchResult.newError(errorId);
            history.put(errorId, res);
            return res;
        }

        int prefixThreshold = recallProperties.getGraph().getPrefixThreshold();
        SignatureNode[] neighbors = tree.findNeighbors(signature);
        SignatureNode predecessor = neighbors[0];
        SignatureNode successor = neighbors[1];

        MatchResult result = MatchResult.newError(errorId);
        result.setCurrentSignature(signature);
        result.setPrefixThreshold(prefixThreshold);

        if (predecessor != null) {
            result.setPredecessorId(predecessor.errorId);
            result.setPredecessorSignature(predecessor.normalizedSignature);
            result.setPredecessorSimilarity(commonPrefixLength(signature, predecessor.normalizedSignature));
        }

        if (successor != null) {
            result.setSuccessorId(successor.errorId);
            result.setSuccessorSignature(successor.normalizedSignature);
            result.setSuccessorSimilarity(commonPrefixLength(signature, successor.normalizedSignature));
        }

        for (SignatureNode neighbor : neighbors) {
            if (neighbor != null && !neighbor.errorId.equals(errorId) &&
                    commonPrefixLength(signature, neighbor.normalizedSignature) >= prefixThreshold) {
                result = MatchResult.linkedTo(neighbor.errorId);
                result.setCurrentSignature(signature);
                result.setPrefixThreshold(prefixThreshold);
                result.setRelationshipType("SIGNATURE_MATCH");
                
                if (predecessor != null) {
                    result.setPredecessorId(predecessor.errorId);
                    result.setPredecessorSignature(predecessor.normalizedSignature);
                    result.setPredecessorSimilarity(commonPrefixLength(signature, predecessor.normalizedSignature));
                }

                if (successor != null) {
                    result.setSuccessorId(successor.errorId);
                    result.setSuccessorSignature(successor.normalizedSignature);
                    result.setSuccessorSimilarity(commonPrefixLength(signature, successor.normalizedSignature));
                }
                
                break;
            }
        }

        tree.insert(signature, errorId);
        history.put(errorId, result);
        return result;
    }

    public MatchResult getMatchResult(Long errorId) {
        return history.get(errorId);
    }

    public int commonPrefixLength(String firstSignature, String secondSignature) {
        return SignatureSimilarity.commonPrefixLength(firstSignature, secondSignature);
    }

    public synchronized void clear() {
        tree.clear();
        history.clear();
    }
}
