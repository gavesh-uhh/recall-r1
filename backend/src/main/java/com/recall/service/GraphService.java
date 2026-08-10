package com.recall.service;

import com.recall.dto.RelationRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.ErrorRelationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;

// Business service managing error relationships, graph traversals, and cross-project clusters
@Service
public class GraphService {

    private static final Logger log = LoggerFactory.getLogger(GraphService.class);

    private static final Set<String> ALLOWED_TYPES =
            Set.of(ErrorRelation.SIGNATURE_MATCH, ErrorRelation.TAG_MATCH, ErrorRelation.MANUAL);

    private final ErrorRecordRepository errorRecordRepository;
    private final ErrorRelationRepository errorRelationRepository;
    private final IndexRegistry indexRegistry;

    public GraphService(ErrorRecordRepository errorRecordRepository,
                        ErrorRelationRepository errorRelationRepository,
                        IndexRegistry indexRegistry) {
        this.errorRecordRepository = errorRecordRepository;
        this.errorRelationRepository = errorRelationRepository;
        this.indexRegistry = indexRegistry;
    }

    // Add a relationship between two error records (saves to DB first, then updates graph)
    @Transactional
    public ErrorRelation addManualRelation(Long id, RelationRequest req) {
        if (req == null || req.relatedErrorId() == null) {
            throw new IllegalArgumentException("relatedErrorId is required");
        }
        Long targetErrorId = req.relatedErrorId();
        if (id == null) {
            throw new IllegalArgumentException("error id is required");
        }
        if (id.equals(targetErrorId)) {
            throw new IllegalArgumentException("an error cannot be related to itself");
        }

        // Make sure both errors exist
        if (!errorRecordRepository.existsById(id)) {
            throw new NoSuchElementException("ErrorRecord not found: " + id);
        }
        if (!errorRecordRepository.existsById(targetErrorId)) {
            throw new NoSuchElementException("ErrorRecord not found: " + targetErrorId);
        }

        String type = (req.type() == null || req.type().isBlank())
                ? ErrorRelation.MANUAL
                : req.type().trim().toUpperCase(java.util.Locale.ROOT);
        if (!ALLOWED_TYPES.contains(type)) {
            throw new IllegalArgumentException("unknown relation type: " + req.type());
        }

        if (!errorRelationRepository.findEdge(id, targetErrorId).isEmpty()) {
            throw new IllegalArgumentException(
                    "relation already exists between " + id + " and " + targetErrorId);
        }

        // Save to database first, then update the in-memory graph
        ErrorRelation saved = errorRelationRepository.save(new ErrorRelation(id, targetErrorId, type));
        final String edgeType = type;
        try {
            indexRegistry.write(() -> indexRegistry.getErrorGraph().addEdge(id, targetErrorId, edgeType));
        } catch (RuntimeException ex) {
            log.error("Persisted relation {}<->{} but failed to update the graph; marking stale",
                    id, targetErrorId, ex);
            indexRegistry.markStale();
        }
        return saved;
    }

    // Find related error records using BFS traversal, maintaining exact proximity order
    @Transactional(readOnly = true)
    public List<ErrorRecord> findRelated(Long id, Integer depth) {
        if (id == null || !errorRecordRepository.existsById(id)) {
            throw new NoSuchElementException("ErrorRecord not found: " + id);
        }

        List<Long> order = indexRegistry.read(() -> depth == null
                ? indexRegistry.getErrorGraph().bfs(id)
                : indexRegistry.getErrorGraph().bfs(id, depth));

        List<Long> ids = order.stream()
                .filter(Objects::nonNull)
                .filter(candidate -> !candidate.equals(id))
                .toList();
        if (ids.isEmpty()) {
            return List.of();
        }

        // Re-sequence database results back into exact BFS order
        Map<Long, ErrorRecord> byId = new HashMap<>();
        for (ErrorRecord record : errorRecordRepository.findAllById(ids)) {
            byId.put(record.getId(), record);
        }
        return ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .toList();
    }

    // Get all connected components from the in-memory graph
    public List<Set<Long>> connectedComponents() {
        return indexRegistry.read(() -> {
            List<Set<Long>> components = indexRegistry.getErrorGraph().connectedComponents();
            List<Set<Long>> copy = new ArrayList<>(components.size());
            for (Set<Long> component : components) {
                copy.add(new LinkedHashSet<>(component));
            }
            return copy;
        });
    }

    // Find connected components that span across at least two distinct projects
    @Transactional(readOnly = true)
    public List<Set<Long>> crossProjectComponents() {
        List<Set<Long>> components = connectedComponents();
        if (components.isEmpty()) {
            return List.of();
        }

        Map<Long, String> projectById = new HashMap<>();
        for (ErrorRecord record : errorRecordRepository.findAll()) {
            projectById.put(record.getId(), record.getProject());
        }

        return components.stream()
                .filter(component -> distinctProjectCount(component, projectById) >= 2)
                .toList();
    }

    // Count distinct project names in a single component
    private static long distinctProjectCount(Set<Long> component, Map<Long, String> projectById) {
        return component.stream()
                .map(projectById::get)
                .filter(project -> project != null && !project.isBlank())
                .map(String::trim)
                .distinct()
                .count();
    }
}
