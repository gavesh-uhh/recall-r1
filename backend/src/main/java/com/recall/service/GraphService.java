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
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

/** Relation management and traversal over the in-memory error graph. */
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

    /**
     * Links two existing error records.
     *
     * @throws NoSuchElementException   when either id is unknown
     * @throws IllegalArgumentException on a self-link, a duplicate edge, or an unrecognised type
     */
    @Transactional
    public ErrorRelation addManualRelation(Long id, RelationRequest req) {
        if (req == null || req.relatedErrorId() == null) {
            throw new IllegalArgumentException("relatedErrorId is required");
        }
        Long other = req.relatedErrorId();
        if (id == null) {
            throw new IllegalArgumentException("error id is required");
        }
        if (id.equals(other)) {
            throw new IllegalArgumentException("an error cannot be related to itself");
        }

        // Validate both endpoints before writing anything.
        if (!errorRecordRepository.existsById(id)) {
            throw new NoSuchElementException("ErrorRecord not found: " + id);
        }
        if (!errorRecordRepository.existsById(other)) {
            throw new NoSuchElementException("ErrorRecord not found: " + other);
        }

        String type = (req.type() == null || req.type().isBlank())
                ? ErrorRelation.MANUAL
                : req.type().trim().toUpperCase(java.util.Locale.ROOT);
        if (!ALLOWED_TYPES.contains(type)) {
            throw new IllegalArgumentException("unknown relation type: " + req.type());
        }

        if (!errorRelationRepository.findEdge(id, other).isEmpty()) {
            throw new IllegalArgumentException("relation already exists between " + id + " and " + other);
        }

        // H2 first, then the graph.
        ErrorRelation saved = errorRelationRepository.save(new ErrorRelation(id, other, type));
        final String edgeType = type;
        try {
            indexRegistry.write(() -> indexRegistry.getErrorGraph().addEdge(id, other, edgeType));
        } catch (RuntimeException ex) {
            log.error("Persisted relation {}<->{} but failed to update the graph; marking stale",
                    id, other, ex);
            indexRegistry.markStale();
        }
        return saved;
    }

    /**
     * BFS-ordered neighbours of {@code id}, excluding the start node.
     *
     * @param depth max hops, or null for an unbounded traversal
     * @throws NoSuchElementException when the start record does not exist
     */
    @Transactional(readOnly = true)
    public List<ErrorRecord> findRelated(Long id, Integer depth) {
        if (id == null || !errorRecordRepository.existsById(id)) {
            throw new NoSuchElementException("ErrorRecord not found: " + id);
        }

        List<Long> order = indexRegistry.read(() -> depth == null
                ? indexRegistry.getErrorGraph().bfs(id)
                : indexRegistry.getErrorGraph().bfs(id, depth));

        List<Long> ids = new ArrayList<>();
        for (Long candidate : order) {
            if (candidate != null && !candidate.equals(id)) {
                ids.add(candidate);
            }
        }
        if (ids.isEmpty()) {
            return List.of();
        }

        // findAllById gives no ordering guarantee, so re-sequence into BFS order.
        Map<Long, ErrorRecord> byId = new HashMap<>();
        for (ErrorRecord record : errorRecordRepository.findAllById(ids)) {
            byId.put(record.getId(), record);
        }
        List<ErrorRecord> out = new ArrayList<>(ids.size());
        for (Long candidate : ids) {
            ErrorRecord record = byId.get(candidate);
            if (record != null) {
                out.add(record);
            }
        }
        return out;
    }

    /** Every connected component of the error graph, as sets of ErrorRecord ids. */
    public List<Set<Long>> connectedComponents() {
        return indexRegistry.read(() -> {
            List<Set<Long>> components = indexRegistry.getErrorGraph().connectedComponents();
            // Copy out so callers never hold a view onto the locked structure.
            List<Set<Long>> copy = new ArrayList<>(components.size());
            for (Set<Long> component : components) {
                // LinkedHashSet, not HashSet: Graph returns members in BFS order and callers
                // (PatternService) rely on that order staying deterministic.
                copy.add(new LinkedHashSet<>(component));
            }
            return copy;
        });
    }

    /** Components whose records span at least two distinct non-blank projects. */
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

        List<Set<Long>> out = new ArrayList<>();
        for (Set<Long> component : components) {
            Set<String> projects = new HashSet<>();
            for (Long memberId : component) {
                String project = projectById.get(memberId);
                if (project != null && !project.isBlank()) {
                    projects.add(project.trim());
                }
            }
            if (projects.size() >= 2) {
                out.add(component);
            }
        }
        return out;
    }
}
