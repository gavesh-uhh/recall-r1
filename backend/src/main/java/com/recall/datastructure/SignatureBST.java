package com.recall.datastructure;

public class SignatureBST {

    private SignatureNode root;

    public SignatureNode getRoot() {
        return root;
    }

    public void insert(String signature, Long errorId) {
        if (signature == null) {
            return;
        }
        if (root == null) {
            root = new SignatureNode(signature, errorId);
            return;
        }
        SignatureNode current = root;
        while (true) {
            int comparisonResult = signature.compareTo(current.normalizedSignature);
            if (comparisonResult < 0) {
                if (current.left == null) {
                    current.left = new SignatureNode(signature, errorId);
                    break;
                }
                current = current.left;
            } else if (comparisonResult > 0) {
                if (current.right == null) {
                    current.right = new SignatureNode(signature, errorId);
                    break;
                }
                current = current.right;
            } else {
                current.errorId = errorId;
                break;
            }
        }
    }

    public SignatureNode[] findNeighbors(String signature) {
        if (signature == null) {
            return new SignatureNode[]{null, null};
        }
        SignatureNode predecessor = null;
        SignatureNode successor = null;
        SignatureNode current = root;

        while (current != null) {
            int comparisonResult = signature.compareTo(current.normalizedSignature);
            if (comparisonResult < 0) {
                successor = current;
                current = current.left;
            } else if (comparisonResult > 0) {
                predecessor = current;
                current = current.right;
            } else {
                predecessor = current;
                successor = current;
                break;
            }
        }
        return new SignatureNode[]{predecessor, successor};
    }

    public void clear() {
        root = null;
    }
}
