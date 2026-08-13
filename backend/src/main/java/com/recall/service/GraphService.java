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
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class GraphService {

    private static final Logger log = LoggerFactory.getLogger(GraphService.class);

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

    @Transactional
    public ErrorRelation addManualRelation(Long sourceId, RelationRequest req) {
        if (req == null || req.relatedErrorId() == null) {
            throw new IllegalArgumentException("relatedErrorId is required");
        }
        if (sourceId == null) {
            throw new IllegalArgumentException("error id is required");
        }

        Long targetId = req.relatedErrorId();
        if (sourceId.equals(targetId)) {
            throw new IllegalArgumentException("an error cannot be related to itself");
        }

        if (!errorRecordRepository.existsById(sourceId)) {
            throw new NoSuchElementException("ErrorRecord not found: " + sourceId);
        }
        if (!errorRecordRepository.existsById(targetId)) {
            throw new NoSuchElementException("ErrorRecord not found: " + targetId);
        }

        String type;
        if (req.type() == null || req.type().trim().isEmpty()) {
            type = ErrorRelation.MANUAL;
        } else {
            type = req.type().trim().toUpperCase(Locale.ROOT);
        }

        if (!ErrorRelation.SIGNATURE_MATCH.equals(type)
                && !ErrorRelation.TAG_MATCH.equals(type)
                && !ErrorRelation.MANUAL.equals(type)) {
            throw new IllegalArgumentException("unknown relation type: " + req.type());
        }

        if (!errorRelationRepository.findEdge(sourceId, targetId).isEmpty()) {
            throw new IllegalArgumentException(
                    "relation already exists between " + sourceId + " and " + targetId);
        }

        ErrorRelation savedRelation = errorRelationRepository.save(new ErrorRelation(sourceId, targetId, type));

        final String edgeType = type;
        try {
            indexRegistry.write(() -> indexRegistry.getErrorGraph().addEdge(sourceId, targetId, edgeType));
        } catch (RuntimeException ex) {
            log.error("Persisted relation {}<->{} but failed to update the graph; marking stale",
                    sourceId, targetId, ex);
            indexRegistry.markStale();
        }

        return savedRelation;
    }

    @Transactional(readOnly = true)
    public List<ErrorRecord> findRelated(Long id, Integer depth) {
        if (id == null || !errorRecordRepository.existsById(id)) {
            throw new NoSuchElementException("ErrorRecord not found: " + id);
        }

        List<Long> traversalOrder = indexRegistry.read(() -> {
            if (depth == null) {
                return indexRegistry.getErrorGraph().bfs(id);
            } else {
                return indexRegistry.getErrorGraph().bfs(id, depth);
            }
        });

        List<Long> targetIds = new ArrayList<>();
        for (Long candidateId : traversalOrder) {
            if (candidateId != null && !candidateId.equals(id)) {
                targetIds.add(candidateId);
            }
        }

        if (targetIds.isEmpty()) {
            return new ArrayList<>();
        }

        Iterable<ErrorRecord> recordsFromDb = errorRecordRepository.findAllById(targetIds);
        Map<Long, ErrorRecord> recordMap = new HashMap<>();
        for (ErrorRecord record : recordsFromDb) {
            recordMap.put(record.getId(), record);
        }

        List<ErrorRecord> resultList = new ArrayList<>();
        for (Long errorId : targetIds) {
            ErrorRecord record = recordMap.get(errorId);
            if (record != null) {
                resultList.add(record);
            }
        }

        return resultList;
    }

    public List<Set<Long>> connectedComponents() {
        return indexRegistry.read(() -> {
            List<Set<Long>> originalComponents = indexRegistry.getErrorGraph().connectedComponents();
            List<Set<Long>> copyList = new ArrayList<>();
            for (Set<Long> component : originalComponents) {
                copyList.add(new LinkedHashSet<>(component));
            }
            return copyList;
        });
    }

    @Transactional(readOnly = true)
    public List<ErrorRelation> findAllRelations() {
        return errorRelationRepository.findAll();
    }

    // Filter connected components across 2 or more projects
    @Transactional(readOnly = true)
    public List<Set<Long>> crossProjectComponents() {
        List<Set<Long>> allComponents = connectedComponents();
        if (allComponents.isEmpty()) {
            return new ArrayList<>();
        }

        Iterable<ErrorRecord> allErrors = errorRecordRepository.findAll();
        Map<Long, String> projectMap = new HashMap<>();
        for (ErrorRecord error : allErrors) {
            projectMap.put(error.getId(), error.getProject());
        }

        List<Set<Long>> crossProjectClusters = new ArrayList<>();
        for (Set<Long> component : allComponents) {
            Set<String> distinctProjects = new HashSet<>();
            for (Long errorId : component) {
                String projectName = projectMap.get(errorId);
                if (projectName != null && !projectName.trim().isEmpty()) {
                    distinctProjects.add(projectName.trim());
                }
            }
            if (distinctProjects.size() >= 2) {
                crossProjectClusters.add(component);
            }
        }

        return crossProjectClusters;
    }
}


