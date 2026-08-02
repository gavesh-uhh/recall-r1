package com.recall.datastructure;

import java.util.AbstractMap;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;


public class AVLTree<K extends Comparable<K>, V> {

    /** Package-private only in the sense of being nested; nothing outside sees Node. */
    private static final class Node<K, V> {
        K key;
        V value;
        int height;
        Node<K, V> left;
        Node<K, V> right;

        Node(K key, V value) {
            this.key = key;
            this.value = value;
            this.height = 1;
        }
    }

    private Node<K, V> root;
    private int size;

    /**
     * Inserts the key, or overwrites the value if the key is already present.
     * A duplicate key never adds a node, so {@link #size()} is unchanged.
     *
     * @throws NullPointerException if {@code key} is null
     */
    public void insert(K key, V value) {
        if (key == null) {
            throw new NullPointerException("AVLTree does not support null keys");
        }
        root = insert(root, key, value);
    }

    private Node<K, V> insert(Node<K, V> node, K key, V value) {
        if (node == null) {
            size++;
            return new Node<>(key, value);
        }
        int cmp = key.compareTo(node.key);
        if (cmp < 0) {
            node.left = insert(node.left, key, value);
        } else if (cmp > 0) {
            node.right = insert(node.right, key, value);
        } else {
            node.value = value; // duplicate key: overwrite in place, no structural change
            return node;
        }
        return rebalance(node);
    }

    /** @return the stored value, or {@code null} if the key is absent (or null). */
    public V search(K key) {
        Node<K, V> node = findNode(key);
        return node == null ? null : node.value;
    }

    private Node<K, V> findNode(K key) {
        if (key == null) {
            return null;
        }
        Node<K, V> current = root;
        while (current != null) {
            int cmp = key.compareTo(current.key);
            if (cmp < 0) {
                current = current.left;
            } else if (cmp > 0) {
                current = current.right;
            } else {
                return current;
            }
        }
        return null;
    }

    /** @return true if a node was actually removed. Rebalances on the way up. */
    public boolean delete(K key) {
        if (key == null) {
            return false;
        }
        int before = size;
        root = delete(root, key);
        return size < before;
    }

    private Node<K, V> delete(Node<K, V> node, K key) {
        if (node == null) {
            return null;
        }
        int cmp = key.compareTo(node.key);
        if (cmp < 0) {
            node.left = delete(node.left, key);
        } else if (cmp > 0) {
            node.right = delete(node.right, key);
        } else {
            size--;
            if (node.left == null) {
                return node.right; // leaf or single right child
            }
            if (node.right == null) {
                return node.left;  // single left child
            }
            // Two children: splice in the in-order successor (smallest key on the right),
            // then drop that successor from the right subtree without double-decrementing size.
            Node<K, V> successor = min(node.right);
            node.key = successor.key;
            node.value = successor.value;
            node.right = deleteMin(node.right);
        }
        return rebalance(node);
    }

    private Node<K, V> deleteMin(Node<K, V> node) {
        if (node.left == null) {
            return node.right;
        }
        node.left = deleteMin(node.left);
        return rebalance(node);
    }

    private Node<K, V> min(Node<K, V> node) {
        Node<K, V> current = node;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }

    /** @return all entries ascending by key. Iterative to avoid deep-recursion surprises. */
    public List<Map.Entry<K, V>> inOrderTraversal() {
        List<Map.Entry<K, V>> out = new ArrayList<>(size);
        Deque<Node<K, V>> stack = new ArrayDeque<>();
        Node<K, V> current = root;
        while (current != null || !stack.isEmpty()) {
            while (current != null) {
                stack.push(current);
                current = current.left;
            }
            current = stack.pop();
            out.add(new AbstractMap.SimpleImmutableEntry<>(current.key, current.value));
            current = current.right;
        }
        return out;
    }

    /** @return number of distinct keys held. */
    public int size() {
        return size;
    }

    /** @return height in nodes; an empty tree has height 0, a single node height 1. */
    public int height() {
        return height(root);
    }

    /** Drops every node. */
    public void clear() {
        root = null;
        size = 0;
    }

    // ---- balancing

    private int height(Node<K, V> node) {
        return node == null ? 0 : node.height;
    }

    private void updateHeight(Node<K, V> node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    /** Positive = left-heavy, negative = right-heavy. */
    private int balanceFactor(Node<K, V> node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }

    private Node<K, V> rebalance(Node<K, V> node) {
        updateHeight(node);
        int balance = balanceFactor(node);

        if (balance > 1) {
            if (balanceFactor(node.left) < 0) {
                node.left = leftRotate(node.left); // LR
            }
            return rightRotate(node); // LL (and the second half of LR)
        }
        if (balance < -1) {
            if (balanceFactor(node.right) > 0) {
                node.right = rightRotate(node.right); // RL
            }
            return leftRotate(node); // RR (and the second half of RL)
        }
        return node;
    }

    /**
     * <pre>
     *      y            x
     *     / \          / \
     *    x   c   =&gt;   a   y
     *   / \              / \
     *  a   b            b   c
     * </pre>
     */
    private Node<K, V> rightRotate(Node<K, V> y) {
        Node<K, V> x = y.left;
        Node<K, V> b = x.right;
        x.right = y;
        y.left = b;
        updateHeight(y);
        updateHeight(x);
        return x;
    }

    /**
     * <pre>
     *    x                y
     *   / \              / \
     *  a   y      =&gt;    x   c
     *     / \          / \
     *    b   c        a   b
     * </pre>
     */
    private Node<K, V> leftRotate(Node<K, V> x) {
        Node<K, V> y = x.right;
        Node<K, V> b = y.left;
        y.left = x;
        x.right = b;
        updateHeight(x);
        updateHeight(y);
        return y;
    }

    // -- test/diagnostic helpers

    /** @return the root key, or {@code null} when empty. Lets tests assert rotation outcomes. */
    public K rootKey() {
        return root == null ? null : root.key;
    }

    /** @return the key of the root's left child, or {@code null}. */
    public K leftChildKey() {
        return root == null || root.left == null ? null : root.left.key;
    }

    /** @return the key of the root's right child, or {@code null}. */
    public K rightChildKey() {
        return root == null || root.right == null ? null : root.right.key;
    }

    /** @return true if every node satisfies the AVL balance invariant. */
    public boolean isBalanced() {
        return isBalanced(root);
    }

    private boolean isBalanced(Node<K, V> node) {
        if (node == null) {
            return true;
        }
        if (node.height != 1 + Math.max(height(node.left), height(node.right))) {
            return false;
        }
        return Math.abs(balanceFactor(node)) <= 1
                && isBalanced(node.left)
                && isBalanced(node.right);
    }
}
