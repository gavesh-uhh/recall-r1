package com.recall.datastructure;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

// In-memory undirected graph using adjacency lists to connect error records
public class Graph<T> {

    // Maps each node to its set of adjacent neighbors (preserves insertion order)
    private final Map<T, Set<T>> adjacencyList = new LinkedHashMap<>();
    
    // Maps unique edge keys to their relationship type (e.g. MANUAL, TAG_MATCH)
    private final Map<String, String> edgeTypes = new LinkedHashMap<>();

    // Add a single node to the graph if it doesn't already exist
    public void addNode(T node) {
        if (node == null) {
            return;
        }
        adjacencyList.computeIfAbsent(node, k -> new LinkedHashSet<>());
    }

    // Connect two nodes with an undirected edge and record the relation type
    public void addEdge(T sourceNode, T targetNode, String type) {
        if (sourceNode == null || targetNode == null || sourceNode.equals(targetNode)) {
            return;
        }
        addNode(sourceNode);
        addNode(targetNode);
        adjacencyList.get(sourceNode).add(targetNode);
        adjacencyList.get(targetNode).add(sourceNode);
        edgeTypes.put(edgeKey(sourceNode, targetNode), type);
    }

    // Get the relation type between two connected nodes
    public String edgeType(T sourceNode, T targetNode) {
        if (!hasEdge(sourceNode, targetNode)) {
            return null;
        }
        return edgeTypes.get(edgeKey(sourceNode, targetNode));
    }

    // Check if an edge exists between two nodes
    public boolean hasEdge(T sourceNode, T targetNode) {
        if (sourceNode == null || targetNode == null) {
            return false;
        }
        Set<T> neighbours = adjacencyList.get(sourceNode);
        return neighbours != null && neighbours.contains(targetNode);
    }

    // Get an unmodifiable view of a node's immediate neighbors
    public Set<T> neighbors(T node) {
        Set<T> neighbours = node == null ? null : adjacencyList.get(node);
        return neighbours == null ? Set.of() : Collections.unmodifiableSet(neighbours);
    }

    // Breadth-First Search traversal starting from startId without depth limit
    public List<T> bfs(T startId) {
        return bfs(startId, Integer.MAX_VALUE);
    }

    // Breadth-First Search traversal starting from startId up to maxDepth hops
    public List<T> bfs(T startId, int maxDepth) {
        List<T> order = new ArrayList<>();
        if (startId == null || !adjacencyList.containsKey(startId) || maxDepth < 0) {
            return order;
        }
        Set<T> visited = new LinkedHashSet<>();
        Deque<T> queue = new ArrayDeque<>();
        visited.add(startId);
        queue.add(startId);
        int depth = 0;
        while (!queue.isEmpty() && depth <= maxDepth) {
            int levelSize = queue.size();
            for (int i = 0; i < levelSize; i++) {
                T current = queue.poll();
                order.add(current);
                if (depth < maxDepth) {
                    for (T neighbour : adjacencyList.getOrDefault(current, Set.of())) {
                        if (visited.add(neighbour)) {
                            queue.add(neighbour);
                        }
                    }
                }
            }
            depth++;
        }
        return order;
    }

    // Find all disjoint connected components in the graph
    public List<Set<T>> connectedComponents() {
        List<Set<T>> components = new ArrayList<>();
        Set<T> seen = new HashSet<>();
        for (T node : adjacencyList.keySet()) {
            if (seen.contains(node)) {
                continue;
            }
            Set<T> component = new LinkedHashSet<>(bfs(node));
            seen.addAll(component);
            components.add(component);
        }
        return components;
    }

    // Remove a node and clean up all edge references connected to it
    public void removeNode(T node) {
        if (node == null) {
            return;
        }
        Set<T> neighbours = adjacencyList.remove(node);
        if (neighbours == null) {
            return;
        }
        for (T neighbour : neighbours) {
            Set<T> back = adjacencyList.get(neighbour);
            if (back != null) {
                back.remove(node);
            }
            edgeTypes.remove(edgeKey(node, neighbour));
        }
    }

    // Get total number of nodes in the graph
    public int nodeCount() {
        return adjacencyList.size();
    }

    // Get total number of unique undirected edges
    public int edgeCount() {
        return adjacencyList.values().stream().mapToInt(Set::size).sum() / 2;
    }

    // Clear all nodes and edges
    public void clear() {
        adjacencyList.clear();
        edgeTypes.clear();
    }

    // Get all node IDs
    public Set<T> nodes() {
        return Collections.unmodifiableSet(adjacencyList.keySet());
    }

    // Build a consistent string key for undirected edge lookup
    private String edgeKey(T sourceNode, T targetNode) {
        String sourceIdStr = String.valueOf(sourceNode);
        String targetIdStr = String.valueOf(targetNode);
        return sourceIdStr.compareTo(targetIdStr) <= 0
                ? sourceIdStr + "\0" + targetIdStr
                : targetIdStr + "\0" + sourceIdStr;
    }
}
