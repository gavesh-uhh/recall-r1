package com.recall.datastructure;

/**
 * Binary Search Tree for storing normalized error signatures lexicographically.
 * Used for fast predecessor and successor neighbor search in fuzzy signature matching.
 */
public class SignatureBST {

    private SignatureNode root;

    public SignatureNode getRoot() {
        return root;
    }

    /**
     * Standard BST insert based on lexicographical string comparison.
     *
     * @param signature normalized signature string key
     * @param errorId   error record ID value
     */
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
            int cmp = signature.compareTo(current.normalizedSignature);
            if (cmp < 0) {
                if (current.left == null) {
                    current.left = new SignatureNode(signature, errorId);
                    break;
                }
                current = current.left;
            } else if (cmp > 0) {
                if (current.right == null) {
                    current.right = new SignatureNode(signature, errorId);
                    break;
                }
                current = current.right;
            } else {
                // Exact key match — update existing errorId mapping
                current.errorId = errorId;
                break;
            }
        }
    }

    /**
     * Finds the immediate predecessor and successor candidate nodes for a given signature.
     *
     * @param signature normalized signature string
     * @return 2-element array containing {predecessor, successor} (either may be null)
     */
    public SignatureNode[] findNeighbors(String signature) {
        if (signature == null) {
            return new SignatureNode[]{null, null};
        }
        SignatureNode predecessor = null;
        SignatureNode successor = null;
        SignatureNode current = root;

        while (current != null) {
            int cmp = signature.compareTo(current.normalizedSignature);
            if (cmp < 0) {
                successor = current;
                current = current.left;
            } else if (cmp > 0) {
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
