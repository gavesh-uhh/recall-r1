package com.recall.dto;

public class SignatureMatchDto {

    private String currentSignature;
    private Integer prefixThreshold;
    private Boolean matchOccurred;
    private Long matchedErrorId;
    private String relationshipType;

    private Candidate predecessor;
    private Candidate successor;

    public static class Candidate {
        private Long errorId;
        private String errorSignature;
        private Integer similarity;

        public Long getErrorId() { return errorId; }
        public void setErrorId(Long errorId) { this.errorId = errorId; }

        public String getErrorSignature() { return errorSignature; }
        public void setErrorSignature(String errorSignature) { this.errorSignature = errorSignature; }

        public Integer getSimilarity() { return similarity; }
        public void setSimilarity(Integer similarity) { this.similarity = similarity; }
    }

    public String getCurrentSignature() { return currentSignature; }
    public void setCurrentSignature(String currentSignature) { this.currentSignature = currentSignature; }

    public Integer getPrefixThreshold() { return prefixThreshold; }
    public void setPrefixThreshold(Integer prefixThreshold) { this.prefixThreshold = prefixThreshold; }

    public Boolean getMatchOccurred() { return matchOccurred; }
    public void setMatchOccurred(Boolean matchOccurred) { this.matchOccurred = matchOccurred; }

    public Long getMatchedErrorId() { return matchedErrorId; }
    public void setMatchedErrorId(Long matchedErrorId) { this.matchedErrorId = matchedErrorId; }

    public String getRelationshipType() { return relationshipType; }
    public void setRelationshipType(String relationshipType) { this.relationshipType = relationshipType; }

    public Candidate getPredecessor() { return predecessor; }
    public void setPredecessor(Candidate predecessor) { this.predecessor = predecessor; }

    public Candidate getSuccessor() { return successor; }
    public void setSuccessor(Candidate successor) { this.successor = successor; }
}
