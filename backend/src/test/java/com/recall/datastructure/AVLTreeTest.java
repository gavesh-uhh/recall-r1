package com.recall.datastructure;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Plain unit tests — no Spring context. */
class AVLTreeTest {

    private static List<Integer> keysOf(AVLTree<Integer, String> tree) {
        List<Integer> keys = new ArrayList<>();
        for (Map.Entry<Integer, String> e : tree.inOrderTraversal()) {
            keys.add(e.getKey());
        }
        return keys;
    }

    @Nested
    @DisplayName("rotations")
    class Rotations {

        @Test
        @DisplayName("LL: descending inserts trigger a single right rotation")
        void leftLeftCase() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(30, "c");
            tree.insert(20, "b");
            tree.insert(10, "a");

            assertEquals(20, tree.rootKey());
            assertEquals(10, tree.leftChildKey());
            assertEquals(30, tree.rightChildKey());
            assertEquals(2, tree.height());
            assertTrue(tree.isBalanced());
            assertEquals(List.of(10, 20, 30), keysOf(tree));
        }

        @Test
        @DisplayName("RR: ascending inserts trigger a single left rotation")
        void rightRightCase() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(10, "a");
            tree.insert(20, "b");
            tree.insert(30, "c");

            assertEquals(20, tree.rootKey());
            assertEquals(10, tree.leftChildKey());
            assertEquals(30, tree.rightChildKey());
            assertEquals(2, tree.height());
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("LR: left rotation of the left child, then right rotation of the root")
        void leftRightCase() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(30, "c");
            tree.insert(10, "a");
            tree.insert(20, "b");

            assertEquals(20, tree.rootKey());
            assertEquals(10, tree.leftChildKey());
            assertEquals(30, tree.rightChildKey());
            assertEquals(2, tree.height());
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("RL: right rotation of the right child, then left rotation of the root")
        void rightLeftCase() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(10, "a");
            tree.insert(30, "c");
            tree.insert(20, "b");

            assertEquals(20, tree.rootKey());
            assertEquals(10, tree.leftChildKey());
            assertEquals(30, tree.rightChildKey());
            assertEquals(2, tree.height());
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("height stays logarithmic for 1..1023 sequential (worst-case) inserts")
        void heightStaysLogarithmic() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            int n = 1023;
            for (int i = 1; i <= n; i++) {
                tree.insert(i, "v" + i);
            }
            assertEquals(n, tree.size());
            assertTrue(tree.isBalanced(), "AVL invariant must hold at every node");

            // An unbalanced BST would be 1023 deep. AVL bound: h <= 1.44 * log2(n+2) - 0.328
            double bound = 1.44 * (Math.log(n + 2) / Math.log(2));
            assertTrue(tree.height() <= bound,
                    "height " + tree.height() + " exceeded AVL bound " + bound);
            assertEquals(10, tree.height(), "a perfectly balanced 1023-node tree is 10 deep");
        }

        @Test
        @DisplayName("descending inserts are balanced too")
        void heightLogarithmicDescending() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            for (int i = 500; i >= 1; i--) {
                tree.insert(i, "v" + i);
            }
            assertEquals(500, tree.size());
            assertTrue(tree.isBalanced());
            assertTrue(tree.height() <= 1.44 * (Math.log(502) / Math.log(2)));
        }
    }

    @Nested
    @DisplayName("search")
    class Search {

        @Test
        void searchHit() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(5, "five");
            tree.insert(2, "two");
            tree.insert(8, "eight");

            assertEquals("five", tree.search(5));
            assertEquals("two", tree.search(2));
            assertEquals("eight", tree.search(8));
        }

        @Test
        void searchMissReturnsNull() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(5, "five");

            assertNull(tree.search(99));
            assertNull(tree.search(null));
            assertNull(new AVLTree<Integer, String>().search(1));
        }
    }

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("leaf")
        void deleteLeaf() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(20, "b");
            tree.insert(10, "a");
            tree.insert(30, "c");

            assertTrue(tree.delete(10));
            assertEquals(2, tree.size());
            assertNull(tree.search(10));
            assertEquals(List.of(20, 30), keysOf(tree));
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("node with a single child promotes that child")
        void deleteOneChildNode() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(20, "b");
            tree.insert(10, "a");
            tree.insert(30, "c");
            tree.insert(5, "z"); // 10 now has a single (left) child

            assertTrue(tree.delete(10));
            assertEquals(3, tree.size());
            assertNull(tree.search(10));
            assertEquals("z", tree.search(5));
            assertEquals(List.of(5, 20, 30), keysOf(tree));
            assertEquals(5, tree.leftChildKey(), "the lone child is spliced into 10's slot");
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("node with two children is replaced by its in-order successor")
        void deleteTwoChildNode() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(20, "b");
            tree.insert(10, "a");
            tree.insert(30, "c");
            tree.insert(25, "d");
            tree.insert(35, "e");

            assertTrue(tree.delete(30));
            assertEquals(4, tree.size());
            assertNull(tree.search(30));
            assertEquals(List.of(10, 20, 25, 35), keysOf(tree));
            assertEquals(35, tree.rightChildKey(), "successor 35 takes 30's place");
            assertEquals("d", tree.search(25));
            assertEquals("e", tree.search(35));
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("delete that unbalances the root forces a rebalance on the way up")
        void deleteForcesRebalance() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(20, "b");
            tree.insert(10, "a");
            tree.insert(30, "c");
            tree.insert(25, "d");
            assertEquals(20, tree.rootKey());

            // Removing 10 leaves 20 right-heavy by 2 with a left-heavy right child -> RL case.
            assertTrue(tree.delete(10));
            assertEquals(25, tree.rootKey());
            assertEquals(20, tree.leftChildKey());
            assertEquals(30, tree.rightChildKey());
            assertEquals(2, tree.height());
            assertTrue(tree.isBalanced());
        }

        @Test
        @DisplayName("deleting an absent key returns false and changes nothing")
        void deleteMiss() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            tree.insert(1, "a");

            assertFalse(tree.delete(42));
            assertFalse(tree.delete(null));
            assertEquals(1, tree.size());
        }

        @Test
        @DisplayName("bulk delete keeps the tree balanced and sorted throughout")
        void bulkDeleteStaysBalanced() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            for (int i = 1; i <= 200; i++) {
                tree.insert(i, "v" + i);
            }
            for (int i = 1; i <= 200; i += 2) {
                assertTrue(tree.delete(i), "expected to remove " + i);
                assertTrue(tree.isBalanced(), "unbalanced after deleting " + i);
            }
            assertEquals(100, tree.size());
            List<Integer> keys = keysOf(tree);
            assertEquals(100, keys.size());
            for (int i = 0; i < keys.size(); i++) {
                assertEquals((i + 1) * 2, keys.get(i));
            }
        }

        @Test
        void deleteEveryNodeEmptiesTree() {
            AVLTree<Integer, String> tree = new AVLTree<>();
            for (int i = 0; i < 30; i++) {
                tree.insert(i, "v" + i);
            }
            for (int i = 0; i < 30; i++) {
                assertTrue(tree.delete(i));
            }
            assertEquals(0, tree.size());
            assertEquals(0, tree.height());
            assertNull(tree.rootKey());
            assertTrue(tree.inOrderTraversal().isEmpty());
        }
    }

    @Test
    @DisplayName("duplicate-key insert overwrites the value without adding a node")
    void duplicateInsertOverwrites() {
        AVLTree<Integer, String> tree = new AVLTree<>();
        tree.insert(1, "first");
        tree.insert(2, "two");
        tree.insert(1, "second");

        assertEquals(2, tree.size());
        assertEquals("second", tree.search(1));
        assertEquals(List.of(1, 2), keysOf(tree));
    }

    @Test
    @DisplayName("inOrderTraversal returns ascending keys")
    void inOrderIsAscending() {
        AVLTree<Integer, String> tree = new AVLTree<>();
        int[] input = {50, 20, 70, 10, 30, 60, 80, 5, 25, 65};
        for (int k : input) {
            tree.insert(k, "v" + k);
        }
        List<Integer> keys = keysOf(tree);
        assertEquals(input.length, keys.size());
        for (int i = 1; i < keys.size(); i++) {
            assertTrue(keys.get(i - 1) < keys.get(i),
                    "not ascending at index " + i + ": " + keys);
        }
        assertEquals(List.of(5, 10, 20, 25, 30, 50, 60, 65, 70, 80), keys);
    }

    @Test
    @DisplayName("String keys work as well as numeric ones")
    void stringKeys() {
        AVLTree<String, Integer> tree = new AVLTree<>();
        tree.insert("delta", 4);
        tree.insert("alpha", 1);
        tree.insert("charlie", 3);
        tree.insert("bravo", 2);

        assertEquals(List.of("alpha", "bravo", "charlie", "delta"),
                tree.inOrderTraversal().stream().map(Map.Entry::getKey).toList());
        assertEquals(3, tree.search("charlie"));
    }

    @Test
    void sizeAndClear() {
        AVLTree<Integer, String> tree = new AVLTree<>();
        assertEquals(0, tree.size());
        assertEquals(0, tree.height());

        for (int i = 0; i < 10; i++) {
            tree.insert(i, "v" + i);
        }
        assertEquals(10, tree.size());
        assertTrue(tree.height() > 0);

        tree.clear();
        assertEquals(0, tree.size());
        assertEquals(0, tree.height());
        assertNull(tree.search(5));
        assertTrue(tree.inOrderTraversal().isEmpty());

        tree.insert(1, "again");
        assertEquals(1, tree.size());
        assertEquals("again", tree.search(1));
    }
}
