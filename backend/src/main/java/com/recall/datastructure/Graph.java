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

// Undirected adjacency-list graph storing error relationships
public class Graph<T> {

    private final Map<T, Set<T>> adjacencyList = new LinkedHashMap<>();
    private final Map<String, String> edgeTypes = new LinkedHashMap<>();

    public void addNode(T node) {
        if (node == null) {
            return;
        }
        if (!adjacencyList.containsKey(node)) {
            adjacencyList.put(node, new LinkedHashSet<>());
        }
    }

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

    public boolean hasEdge(T sourceNode, T targetNode) {
        if (sourceNode == null || targetNode == null) {
            return false;
        }
        Set<T> neighbors = adjacencyList.get(sourceNode);
        return neighbors != null && neighbors.contains(targetNode);
    }

    public String edgeType(T sourceNode, T targetNode) {
        if (!hasEdge(sourceNode, targetNode)) {
            return null;
        }
        return edgeTypes.get(edgeKey(sourceNode, targetNode));
    }

    public Set<T> neighbors(T node) {
        if (node == null || !adjacencyList.containsKey(node)) {
            return Collections.emptySet();
        }
        return Collections.unmodifiableSet(adjacencyList.get(node));
    }

    // Breadth-First Search (BFS)
    public List<T> bfs(T startId) {
        return bfs(startId, Integer.MAX_VALUE);
    }

    public List<T> bfs(T startId, int maxDepth) {
        List<T> visitOrder = new ArrayList<>();
        if (startId == null || !adjacencyList.containsKey(startId) || maxDepth < 0) {
            return visitOrder;
        }

        Set<T> visited = new HashSet<>();
        Deque<T> queue = new ArrayDeque<>();

        visited.add(startId);
        queue.add(startId);

        int currentDepth = 0;
        while (!queue.isEmpty() && currentDepth <= maxDepth) {
            int levelSize = queue.size();
            for (int i = 0; i < levelSize; i++) {
                T current = queue.poll();
                visitOrder.add(current);

                if (currentDepth < maxDepth) {
                    Set<T> neighborSet = adjacencyList.get(current);
                    if (neighborSet != null) {
                        for (T neighbor : neighborSet) {
                            if (!visited.contains(neighbor)) {
                                visited.add(neighbor);
                                queue.add(neighbor);
                            }
                        }
                    }
                }
            }
            currentDepth++;
        }
        return visitOrder;
    }

    // Depth-First Search (DFS)
    public List<T> dfs(T startId) {
        List<T> visitOrder = new ArrayList<>();
        if (startId == null || !adjacencyList.containsKey(startId)) {
            return visitOrder;
        }

        Set<T> visited = new HashSet<>();
        Deque<T> stack = new ArrayDeque<>();

        stack.push(startId);

        while (!stack.isEmpty()) {
            T current = stack.pop();
            if (!visited.contains(current)) {
                visited.add(current);
                visitOrder.add(current);

                Set<T> neighborSet = adjacencyList.get(current);
                if (neighborSet != null) {
                    List<T> neighborList = new ArrayList<>(neighborSet);
                    for (int i = neighborList.size() - 1; i >= 0; i--) {
                        T neighbor = neighborList.get(i);
                        if (!visited.contains(neighbor)) {
                            stack.push(neighbor);
                        }
                    }
                }
            }
        }
        return visitOrder;
    }

    // Find connected components
    public List<Set<T>> connectedComponents() {
        List<Set<T>> components = new ArrayList<>();
        Set<T> overallVisited = new HashSet<>();

        for (T node : adjacencyList.keySet()) {
            if (!overallVisited.contains(node)) {
                List<T> componentList = bfs(node);
                Set<T> componentSet = new LinkedHashSet<>(componentList);
                overallVisited.addAll(componentSet);
                components.add(componentSet);
            }
        }
        return components;
    }

    public void removeNode(T node) {
        if (node == null || !adjacencyList.containsKey(node)) {
            return;
        }

        Set<T> connectedNeighbors = adjacencyList.remove(node);
        if (connectedNeighbors != null) {
            for (T neighbor : connectedNeighbors) {
                Set<T> neighborSet = adjacencyList.get(neighbor);
                if (neighborSet != null) {
                    neighborSet.remove(node);
                }
                edgeTypes.remove(edgeKey(node, neighbor));
            }
        }
    }

    public int nodeCount() {
        return adjacencyList.size();
    }

    public int edgeCount() {
        int totalSum = 0;
        for (Set<T> neighbors : adjacencyList.values()) {
            totalSum += neighbors.size();
        }
        return totalSum / 2;
    }

    public void clear() {
        adjacencyList.clear();
        edgeTypes.clear();
    }

    public Set<T> nodes() {
        return Collections.unmodifiableSet(adjacencyList.keySet());
    }

    private String edgeKey(T sourceNode, T targetNode) {
        String s1 = String.valueOf(sourceNode);
        String s2 = String.valueOf(targetNode);
        if (s1.compareTo(s2) <= 0) {
            return s1 + "\0" + s2;
        } else {
            return s2 + "\0" + s1;
        }
    }
}


