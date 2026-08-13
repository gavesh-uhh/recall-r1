package com.recall.service;

import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.ErrorRelationRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Rehydrates the in-memory indexes from H2 at startup (and on demand after a
 * {@link IndexRegistry#markStale() stale} divergence).
 *
 * <p>Solutions are deliberately <em>not</em> preloaded into any global heap: solution ranking is
 * time-dependent, so the heap is built per request in {@link SolutionService} against a single
 * {@code now} instant. A long-lived heap would silently rot as its scores aged.
 */
@Service
public class IndexBootstrapService {

    private static final Logger log = LoggerFactory.getLogger(IndexBootstrapService.class);

    private final ErrorRecordRepository errorRecordRepository;
    private final ErrorRelationRepository errorRelationRepository;
    private final IndexRegistry indexRegistry;
    private final FuzzyMatchService fuzzyMatchService;

    public IndexBootstrapService(ErrorRecordRepository errorRecordRepository,
                                 ErrorRelationRepository errorRelationRepository,
                                 IndexRegistry indexRegistry,
                                 FuzzyMatchService fuzzyMatchService) {
        this.errorRecordRepository = errorRecordRepository;
        this.errorRelationRepository = errorRelationRepository;
        this.indexRegistry = indexRegistry;
        this.fuzzyMatchService = fuzzyMatchService;
    }

    @PostConstruct
    void bootstrap() {
        rebuild();
    }

    /**
     * Clears and repopulates the AVL signature index, BST signature index, and the error graph from the database.
     * Read-only transaction: nothing here writes.
     */
    @Transactional(readOnly = true)
    public void rebuild() {
        List<ErrorRecord> records = errorRecordRepository.findAll();
        List<ErrorRelation> relations = errorRelationRepository.findAll();

        int[] counters = new int[]{0, 0, 0}; // avlInserts, nodes, edges

        indexRegistry.write(() -> {
            indexRegistry.getSignatureIndex().clear();
            indexRegistry.getErrorGraph().clear();
            fuzzyMatchService.clear();

            for (ErrorRecord record : records) {
                Long id = record.getId();
                if (id == null) {
                    continue;
                }
                indexRegistry.getErrorGraph().addNode(id);
                counters[1]++;

                String signature = record.getSignature();
                if (signature == null || signature.isBlank()) {
                    log.debug("ErrorRecord id={} has no signature; skipping AVL insert", id);
                    continue;
                }
                // A signature can legitimately repeat across records (same error seen in two
                // projects). The AVL keeps exactly one id per key — last writer wins — and callers
                // that need every match go through ErrorRecordRepository.findBySignature.
                Long existing = indexRegistry.getSignatureIndex().search(signature);
                if (existing != null && !existing.equals(id)) {
                    log.debug("Signature collision on '{}': AVL entry {} overwritten by {}",
                            signature, existing, id);
                }
                indexRegistry.getSignatureIndex().insert(signature, id);
                fuzzyMatchService.processNewError(signature, id);
                counters[0]++;
            }

            for (ErrorRelation relation : relations) {
                Long a = relation.getErrorAId();
                Long b = relation.getErrorBId();
                if (a == null || b == null || a.equals(b)) {
                    continue;
                }
                indexRegistry.getErrorGraph().addEdge(a, b, relation.getRelationType());
                counters[2]++;
            }
        });

        indexRegistry.clearStale();
        log.info("Index rebuild complete: {} error records ({} AVL entries), {} graph nodes, {} edges",
                records.size(), counters[0], counters[1], counters[2]);
    }
}
