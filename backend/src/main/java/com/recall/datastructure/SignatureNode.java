package com.recall.datastructure;

/**
 * Node in the {@link SignatureBST}, holding a normalized signature string key
 * and the associated ErrorRecord ID value.
 */
public class SignatureNode {

    public String normalizedSignature;
    public Long errorId;
    public SignatureNode left;
    public SignatureNode right;

    public SignatureNode(String normalizedSignature, Long errorId) {
        this.normalizedSignature = normalizedSignature;
        this.errorId = errorId;
    }

    public String getNormalizedSignature() {
        return normalizedSignature;
    }

    public Long getErrorId() {
        return errorId;
    }

    public SignatureNode getLeft() {
        return left;
    }

    public SignatureNode getRight() {
        return right;
    }
}
