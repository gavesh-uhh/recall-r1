package com.recall.service;

public class MatchResult {

    private final boolean linked;
    private final Long errorId;

    private String currentSignature;
    private Long predecessorId;
    private String predecessorSignature;
    private Integer predecessorSimilarity;
    private Long successorId;
    private String successorSignature;
    private Integer successorSimilarity;
    private Integer prefixThreshold;
    private String relationshipType;

    private MatchResult(boolean linked, Long errorId) {
        this.linked = linked;
        this.errorId = errorId;
    }

    public static MatchResult linkedTo(Long existingErrorId) {
        return new MatchResult(true, existingErrorId);
    }

    public static MatchResult newError(Long newErrorId) {
        return new MatchResult(false, newErrorId);
    }

    public boolean isLinked() {
        return linked;
    }

    public Long getErrorId() {
        return errorId;
    }

    // Getters and setters for the new fields
    public String getCurrentSignature() { return currentSignature; }
    public MatchResult setCurrentSignature(String currentSignature) { this.currentSignature = currentSignature; return this; }
    
    public Long getPredecessorId() { return predecessorId; }
    public MatchResult setPredecessorId(Long predecessorId) { this.predecessorId = predecessorId; return this; }
    
    public String getPredecessorSignature() { return predecessorSignature; }
    public MatchResult setPredecessorSignature(String predecessorSignature) { this.predecessorSignature = predecessorSignature; return this; }
    
    public Integer getPredecessorSimilarity() { return predecessorSimilarity; }
    public MatchResult setPredecessorSimilarity(Integer predecessorSimilarity) { this.predecessorSimilarity = predecessorSimilarity; return this; }
    
    public Long getSuccessorId() { return successorId; }
    public MatchResult setSuccessorId(Long successorId) { this.successorId = successorId; return this; }
    
    public String getSuccessorSignature() { return successorSignature; }
    public MatchResult setSuccessorSignature(String successorSignature) { this.successorSignature = successorSignature; return this; }
    
    public Integer getSuccessorSimilarity() { return successorSimilarity; }
    public MatchResult setSuccessorSimilarity(Integer successorSimilarity) { this.successorSimilarity = successorSimilarity; return this; }
    
    public Integer getPrefixThreshold() { return prefixThreshold; }
    public MatchResult setPrefixThreshold(Integer prefixThreshold) { this.prefixThreshold = prefixThreshold; return this; }
    
    public String getRelationshipType() { return relationshipType; }
    public MatchResult setRelationshipType(String relationshipType) { this.relationshipType = relationshipType; return this; }
}
