package com.recall.datastructure;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Plain unit tests — no Spring context. */
class GraphTest {

    /**
     * <pre>
     *   1 —— 2 —— 4
     *   |    |
     *   3 —— 5 —— 6
     * </pre>
     * Nodes are added 1..6 in order, so BFS from 1 is deterministic.
     */
    private static Graph<Integer> sampleGraph() {
        Graph<Integer> g = new Graph<>();
        for (int i = 1; i <= 6; i++) {
            g.addNode(i);
        }
        g.addEdge(1, 2, "SIMILAR");
        g.addEdge(1, 3, "SIMILAR");
        g.addEdge(2, 4, "CAUSED_BY");
        g.addEdge(2, 5, "SIMILAR");
        g.addEdge(3, 5, "DUPLICATE");
        g.addEdge(5, 6, "SIMILAR");
        return g;
    }

    @Test
    @DisplayName("BFS visits in level order using insertion order within a level")
    void bfsOrder() {
        Graph<Integer> g = sampleGraph();

        // level 0: 1 | level 1: 2, 3 | level 2: 4, 5 | level 3: 6
        assertEquals(List.of(1, 2, 3, 4, 5, 6), g.bfs(1));
        assertEquals(List.of(4, 2, 1, 5, 3, 6), g.bfs(4));
        assertEquals(List.of(6, 5, 2, 3, 1, 4), g.bfs(6));
    }

    @Test
    @DisplayName("BFS on an unknown or null start node returns an empty list")
    void bfsUnknownStart() {
        Graph<Integer> g = sampleGraph();
        assertTrue(g.bfs(99).isEmpty());
        assertTrue(g.bfs(null).isEmpty());
        assertTrue(new Graph<Integer>().bfs(1).isEmpty());
    }

    @Test
    @DisplayName("depth-limited BFS: depth 0 is the start node only")
    void bfsDepthLimited() {
        Graph<Integer> g = sampleGraph();

        assertEquals(List.of(1), g.bfs(1, 0));
        assertEquals(List.of(1, 2, 3), g.bfs(1, 1));
        assertEquals(List.of(1, 2, 3, 4, 5), g.bfs(1, 2));
        assertEquals(List.of(1, 2, 3, 4, 5, 6), g.bfs(1, 3));
        assertEquals(List.of(1, 2, 3, 4, 5, 6), g.bfs(1, 99), "cap beyond diameter is harmless");
        assertTrue(g.bfs(1, -1).isEmpty());
    }

    @Test
    @DisplayName("connectedComponents finds all three components, singleton included")
    void connectedComponents() {
        Graph<String> g = new Graph<>();
        // component A: a-b-c
        g.addEdge("a", "b", "SIMILAR");
        g.addEdge("b", "c", "SIMILAR");
        // component B: d-e
        g.addEdge("d", "e", "CAUSED_BY");
        // component C: lone node
        g.addNode("z");

        List<Set<String>> components = g.connectedComponents();
        assertEquals(3, components.size());
        assertEquals(Set.of("a", "b", "c"), components.get(0));
        assertEquals(Set.of("d", "e"), components.get(1));
        assertEquals(Set.of("z"), components.get(2));

        int covered = components.stream().mapToInt(Set::size).sum();
        assertEquals(g.nodeCount(), covered, "components must partition the node set");
    }

    @Test
    @DisplayName("an empty graph has no components")
    void connectedComponentsEmpty() {
        assertTrue(new Graph<Integer>().connectedComponents().isEmpty());
    }

    @Test
    @DisplayName("removeNode drops the node and every incident edge and type entry")
    void removeNodeDropsEdges() {
        Graph<Integer> g = sampleGraph();
        assertEquals(6, g.nodeCount());
        assertEquals(6, g.edgeCount());

        g.removeNode(2);

        assertEquals(5, g.nodeCount());
        assertEquals(3, g.edgeCount(), "1-2, 2-4 and 2-5 are gone");
        assertFalse(g.nodes().contains(2));
        assertFalse(g.hasEdge(1, 2));
        assertFalse(g.hasEdge(2, 1));
        assertFalse(g.neighbors(1).contains(2));
        assertFalse(g.neighbors(5).contains(2));
        assertTrue(g.neighbors(4).isEmpty(), "4 is now isolated");
        assertNull(g.edgeType(1, 2));
        assertNull(g.edgeType(2, 5));
        assertEquals("DUPLICATE", g.edgeType(3, 5), "untouched edges survive");

        // 4 became a singleton component
        assertEquals(List.of(4), g.bfs(4));

        g.removeNode(2);   // idempotent
        g.removeNode(null);
        g.removeNode(999);
        assertEquals(5, g.nodeCount());
    }

    @Test
    @DisplayName("self-loops and null endpoints are ignored")
    void selfLoopIgnored() {
        Graph<Integer> g = new Graph<>();
        g.addNode(1);
        g.addEdge(1, 1, "SIMILAR");

        assertEquals(1, g.nodeCount());
        assertEquals(0, g.edgeCount());
        assertFalse(g.hasEdge(1, 1));
        assertNull(g.edgeType(1, 1));
        assertTrue(g.neighbors(1).isEmpty());

        g.addEdge(null, 2, "SIMILAR");
        g.addEdge(2, null, "SIMILAR");
        g.addNode(null);
        assertEquals(1, g.nodeCount(), "nulls never create nodes");
    }

    @Test
    @DisplayName("edgeType round-trips regardless of argument order and survives overwrite")
    void edgeTypeRoundTrip() {
        Graph<Long> g = new Graph<>();
        g.addEdge(10L, 20L, "CAUSED_BY");

        assertEquals("CAUSED_BY", g.edgeType(10L, 20L));
        assertEquals("CAUSED_BY", g.edgeType(20L, 10L), "undirected: key is order-independent");
        assertTrue(g.hasEdge(10L, 20L));
        assertTrue(g.hasEdge(20L, 10L));
        assertEquals(1, g.edgeCount());

        // Re-adding in the opposite direction overwrites the label, not the structure.
        g.addEdge(20L, 10L, "DUPLICATE");
        assertEquals(1, g.edgeCount());
        assertEquals("DUPLICATE", g.edgeType(10L, 20L));

        assertNull(g.edgeType(10L, 30L), "no edge -> no type");
        assertNull(g.edgeType(null, 10L));
        assertFalse(g.hasEdge(10L, null));
    }

    @Test
    @DisplayName("addEdge implicitly creates missing endpoints; addNode is idempotent")
    void addEdgeCreatesNodes() {
        Graph<String> g = new Graph<>();
        g.addEdge("x", "y", "SIMILAR");

        assertEquals(Set.of("x", "y"), g.nodes());
        assertEquals(Set.of("y"), g.neighbors("x"));
        assertEquals(Set.of("x"), g.neighbors("y"));

        g.addNode("x");
        assertEquals(2, g.nodeCount());
        assertEquals(Set.of("y"), g.neighbors("x"), "re-adding a node must not clear its edges");
    }

    @Test
    @DisplayName("neighbors returns an empty, unmodifiable set for unknown nodes")
    void neighborsUnknownNode() {
        Graph<Integer> g = sampleGraph();
        assertTrue(g.neighbors(42).isEmpty());
        assertTrue(g.neighbors(null).isEmpty());
        assertEquals(Set.of(2, 3), g.neighbors(1));
        assertThrows(UnsupportedOperationException.class, () -> g.neighbors(1).add(9));
    }

    @Test
    void nodeCountEdgeCountAndClear() {
        Graph<Integer> g = sampleGraph();
        assertEquals(6, g.nodeCount());
        assertEquals(6, g.edgeCount());
        assertEquals(Set.of(1, 2, 3, 4, 5, 6), g.nodes());

        g.clear();
        assertEquals(0, g.nodeCount());
        assertEquals(0, g.edgeCount());
        assertTrue(g.nodes().isEmpty());
        assertTrue(g.bfs(1).isEmpty());
        assertNull(g.edgeType(1, 2));

        g.addEdge(7, 8, "SIMILAR");
        assertEquals(2, g.nodeCount());
        assertEquals(1, g.edgeCount());
    }
}
