package com.recall.datastructure;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class SignatureBSTTest {

    @Test
    void findNeighborsInEmptyTree() {
        SignatureBST bst = new SignatureBST();
        SignatureNode[] neighbors = bst.findNeighbors("anything");
        assertNotNull(neighbors);
        assertEquals(2, neighbors.length);
        assertNull(neighbors[0], "Predecessor should be null in an empty tree");
        assertNull(neighbors[1], "Successor should be null in an empty tree");
    }

    @Test
    void bstInsertAndNeighborSearchOnKnownTree() {
        SignatureBST bst = new SignatureBST();
        // Insert nodes in balanced order to build a known BST
        bst.insert("m", 10L);
        bst.insert("c", 20L);
        bst.insert("s", 30L);
        bst.insert("a", 40L);
        bst.insert("g", 50L);
        bst.insert("p", 60L);
        bst.insert("x", 70L);

        // Search for "f" -> predecessor should be "c", successor should be "g"
        SignatureNode[] neighborsF = bst.findNeighbors("f");
        assertNotNull(neighborsF[0], "Predecessor for 'f' should be found");
        assertEquals("c", neighborsF[0].normalizedSignature);
        assertNotNull(neighborsF[1], "Successor for 'f' should be found");
        assertEquals("g", neighborsF[1].normalizedSignature);

        // Search for "a" (smallest element / exact match) -> exact match returns predecessor & successor as "a"
        SignatureNode[] neighborsA = bst.findNeighbors("a");
        assertEquals("a", neighborsA[0].normalizedSignature);
        assertEquals("a", neighborsA[1].normalizedSignature);

        // Search for "@" (smaller than all) -> predecessor null, successor "a"
        SignatureNode[] neighborsMin = bst.findNeighbors("@");
        assertNull(neighborsMin[0], "Predecessor for value smaller than all should be null");
        assertNotNull(neighborsMin[1]);
        assertEquals("a", neighborsMin[1].normalizedSignature);

        // Search for "z" (larger than all) -> predecessor "x", successor null
        SignatureNode[] neighborsMax = bst.findNeighbors("z");
        assertNotNull(neighborsMax[0]);
        assertEquals("x", neighborsMax[0].normalizedSignature);
        assertNull(neighborsMax[1], "Successor for value larger than all should be null");
    }

    @Test
    void exactMatchSignature() {
        SignatureBST bst = new SignatureBST();
        bst.insert("java.lang.NullPointerException: foo", 1L);

        SignatureNode[] neighbors = bst.findNeighbors("java.lang.NullPointerException: foo");
        assertNotNull(neighbors[0]);
        assertNotNull(neighbors[1]);
        assertEquals(1L, neighbors[0].errorId);
        assertEquals(1L, neighbors[1].errorId);
    }

    @Test
    void worstCaseSortedInsertDegradesToLinkedList() {
        SignatureBST bst = new SignatureBST();
        // Inserting strictly ascending keys causes BST to degrade to a right-skewed linked list
        bst.insert("a", 1L);
        bst.insert("b", 2L);
        bst.insert("c", 3L);
        bst.insert("d", 4L);
        bst.insert("e", 5L);

        SignatureNode root = bst.getRoot();
        assertNotNull(root);
        assertEquals("a", root.normalizedSignature);
        assertNull(root.left, "Root should have no left child in right-skewed degenerate BST");
        assertNotNull(root.right);

        SignatureNode nodeB = root.right;
        assertEquals("b", nodeB.normalizedSignature);
        assertNull(nodeB.left);
        assertNotNull(nodeB.right);

        SignatureNode nodeC = nodeB.right;
        assertEquals("c", nodeC.normalizedSignature);
        assertNull(nodeC.left);
        assertNotNull(nodeC.right);

        SignatureNode nodeD = nodeC.right;
        assertEquals("d", nodeD.normalizedSignature);
        assertNull(nodeD.left);
        assertNotNull(nodeD.right);

        SignatureNode nodeE = nodeD.right;
        assertEquals("e", nodeE.normalizedSignature);
        assertNull(nodeE.left);
        assertNull(nodeE.right, "Leaf node 'e' should have no right child");
    }
}
