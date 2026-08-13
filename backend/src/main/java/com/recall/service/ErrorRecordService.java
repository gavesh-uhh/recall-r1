package com.recall.service;

import com.recall.config.RecallProperties;
import com.recall.datastructure.SignatureSimilarity;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.repository.DebugSessionRepository;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.ErrorRelationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

/**
 * CRUD for error records, plus the write-through maintenance of the AVL signature index and the
 * error graph.
 *
 * <p>Sync rule: H2 is the source of truth and is always written first. If the follow-up in-memory
 * mutation fails we log at ERROR and {@link IndexRegistry#markStale() mark the indexes stale}
 * rather than pretend the two views still agree.
 */
@Service
public class ErrorRecordService {

    private static final Logger log = LoggerFactory.getLogger(ErrorRecordService.class);

    private static final int SIGNATURE_HASH_LENGTH = 16;

    private final ErrorRecordRepository repository;
    private final ErrorRelationRepository errorRelationRepository;
    private final DebugSessionRepository debugSessionRepository;
    private final IndexRegistry indexRegistry;
    private final RecallProperties recallProperties;
    private final FuzzyMatchService fuzzyMatchService;

    public ErrorRecordService(ErrorRecordRepository repository,
                              ErrorRelationRepository errorRelationRepository,
                              DebugSessionRepository debugSessionRepository,
                              IndexRegistry indexRegistry,
                              RecallProperties recallProperties,
                              FuzzyMatchService fuzzyMatchService) {
        this.repository = repository;
        this.errorRelationRepository = errorRelationRepository;
        this.debugSessionRepository = debugSessionRepository;
        this.indexRegistry = indexRegistry;
        this.recallProperties = recallProperties;
        this.fuzzyMatchService = fuzzyMatchService;
    }

    /**
     * Persists a new error record, then mirrors it into the AVL index and the graph and runs
     * auto-edge detection.
     */
    @Transactional
    public ErrorRecord create(ErrorRecord incoming) {
        if (incoming.getSignature() == null || incoming.getSignature().isBlank()) {
            String type = deriveType(incoming);
            incoming.setSignature(normalizeSignature(type, incoming.getMessage()));
        }

        // 1. H2 first — the database is authoritative.
        ErrorRecord saved = repository.save(incoming);

        // 2. Then the in-memory structures. Failures here must never corrupt the response, but
        //    they must be visible: log + markStale so a rebuild can repair the divergence.
        try {
            final Long id = saved.getId();
            final String signature = saved.getSignature();
            indexRegistry.write(() -> {
                if (signature != null && !signature.isBlank()) {
                    Long existing = indexRegistry.getSignatureIndex().search(signature);
                    if (existing != null && !existing.equals(id)) {
                        log.debug("Signature collision on '{}': AVL entry {} overwritten by {}",
                                signature, existing, id);
                    }
                    indexRegistry.getSignatureIndex().insert(signature, id);
                }
                indexRegistry.getErrorGraph().addNode(id);
            });
        } catch (RuntimeException ex) {
            log.error("Failed to index ErrorRecord id={} in memory; marking indexes stale",
                    saved.getId(), ex);
            indexRegistry.markStale();
        }

        try {
            int created = autoLinkEdges(saved);
            if (created > 0) {
                log.debug("Auto-linked {} edge(s) for ErrorRecord id={}", created, saved.getId());
            }
        } catch (RuntimeException ex) {
            log.error("Auto-link failed for ErrorRecord id={}; marking indexes stale",
                    saved.getId(), ex);
            indexRegistry.markStale();
        }

        return saved;
    }

    public Optional<ErrorRecord> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findById(id);
    }

    /**
     * Signature lookup: O(log n) through the AVL index first, falling back to the repository.
     *
     * <p>An AVL miss normally means the signature genuinely does not exist, so the repository
     * fallback only matters when the indexes are {@link IndexRegistry#isStale() stale} or when the
     * id the AVL held has since been deleted. We still probe H2 in that case because a wrong
     * "not found" is worse than one extra indexed query.
     */
    @Transactional(readOnly = true)
    public Optional<ErrorRecord> findBySignature(String signature) {
        if (signature == null || signature.isBlank()) {
            return Optional.empty();
        }
        Long id = indexRegistry.read(() -> indexRegistry.getSignatureIndex().search(signature));
        if (id != null) {
            Optional<ErrorRecord> hit = repository.findById(id);
            if (hit.isPresent()) {
                return hit;
            }
            log.debug("AVL held id={} for signature '{}' but the row is gone; marking stale",
                    id, signature);
            indexRegistry.markStale();
        }
        return repository.findFirstBySignature(signature);
    }

    /** Browse view — straight to H2; blank filters are passed as null so the query ignores them. */
    @Transactional(readOnly = true)
    public List<ErrorRecord> browse(String project, String language) {
        return repository.search(blankToNull(project), blankToNull(language));
    }

    /**
     * Full cascade delete: relations, graph node, AVL entry, debug sessions, then the record
     * itself (JPA removes its solutions via {@code orphanRemoval}).
     */
    @Transactional
    public void delete(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("id is required");
        }
        // Signal a missing record rather than reporting a no-op delete as success — a client
        // deleting a stale id needs to know it was already gone.
        ErrorRecord record = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No error record with id " + id));
        String signature = record.getSignature();

        // Relations reference ids, not FKs, so clean them explicitly.
        errorRelationRepository.deleteAllTouching(id);
        // DebugSession holds a real FK to error_record; leaving rows behind would block the delete.
        debugSessionRepository.deleteByErrorRecordId(id);

        try {
            indexRegistry.write(() -> {
                indexRegistry.getErrorGraph().removeNode(id);
                if (signature != null && !signature.isBlank()) {
                    Long mapped = indexRegistry.getSignatureIndex().search(signature);
                    // Only evict when the AVL still points at THIS record — another record may
                    // share the signature and have overwritten the entry.
                    if (id.equals(mapped)) {
                        indexRegistry.getSignatureIndex().delete(signature);
                    }
                }
            });
        } catch (RuntimeException ex) {
            log.error("Failed to remove ErrorRecord id={} from in-memory indexes; marking stale",
                    id, ex);
            indexRegistry.markStale();
        }

        repository.delete(record);
    }

    public String normalizeSignature(String type, String message) {
        ParsedSignature sig = SignatureParser.parse(message);
        return sig.toSearchableString();
    }

    /**
     * Creates edges from {@code saved} to existing records and returns how many were persisted.
     *
     * <ul>
     *   <li>SIGNATURE_MATCH — same non-blank project and common prefix length
     *       {@code >= recall.graph.prefix-threshold} via BST neighbor matching.</li>
     *   <li>TAG_MATCH — at least one shared non-blank tag, compared case-insensitively.</li>
     * </ul>
     *
     * H2 first (guarded against duplicates by {@code findEdge}), then the graph.
     */
    @Transactional
    public int autoLinkEdges(ErrorRecord saved) {
        if (saved == null || saved.getId() == null) {
            return 0;
        }
        Long selfId = saved.getId();

        // Candidate -> edge type. LinkedHashMap keeps the outcome deterministic, and the first
        // rule to claim a candidate wins (signature similarity is the stronger signal).
        Map<Long, String> candidates = new LinkedHashMap<>();

        String project = blankToNull(saved.getProject());
        if (project != null && saved.getSignature() != null && !saved.getSignature().isBlank()) {
            MatchResult match = fuzzyMatchService.processNewError(saved.getSignature(), selfId);
            if (match.isLinked() && !selfId.equals(match.getErrorId())) {
                candidates.put(match.getErrorId(), ErrorRelation.SIGNATURE_MATCH);
            }
        }

        Set<String> myTags = lowerTags(saved.getTags());
        if (!myTags.isEmpty()) {
            // Tradeoff: no tag-indexed query exists on the repository, so we scan every record and
            // filter in memory. That is O(n) per insert, acceptable at this corpus size (a personal
            // error journal, thousands of rows at most). If it ever grows, add a
            // `findByTagsIn(Collection<String>)` derived query or a dedicated tag index instead of
            // widening this scan.
            for (ErrorRecord other : repository.findAll()) {
                if (other.getId() == null || other.getId().equals(selfId)) {
                    continue;
                }
                if (candidates.containsKey(other.getId())) {
                    continue;
                }
                Set<String> otherTags = lowerTags(other.getTags());
                otherTags.retainAll(myTags);
                if (!otherTags.isEmpty()) {
                    candidates.put(other.getId(), ErrorRelation.TAG_MATCH);
                }
            }
        }

        int created = 0;
        for (Map.Entry<Long, String> entry : candidates.entrySet()) {
            Long otherId = entry.getKey();
            String type = entry.getValue();
            if (!errorRelationRepository.findEdge(selfId, otherId).isEmpty()) {
                continue; // already related in either orientation
            }
            errorRelationRepository.save(new ErrorRelation(selfId, otherId, type));
            created++;
            try {
                indexRegistry.write(() -> indexRegistry.getErrorGraph().addEdge(selfId, otherId, type));
            } catch (RuntimeException ex) {
                log.error("Persisted edge {}<->{} but failed to add it to the graph; marking stale",
                        selfId, otherId, ex);
                indexRegistry.markStale();
            }
        }
        return created;
    }

    // ---------------------------------------------------------------- helpers

    private static String deriveType(ErrorRecord record) {
        if (record.getFramework() != null && !record.getFramework().isBlank()) {
            return record.getFramework().trim();
        }
        if (record.getLanguage() != null && !record.getLanguage().isBlank()) {
            return record.getLanguage().trim();
        }
        return "UNKNOWN";
    }



    private static Set<String> lowerTags(List<String> tags) {
        Set<String> out = new HashSet<>();
        if (tags == null) {
            return out;
        }
        for (String tag : new ArrayList<>(tags)) {
            if (tag != null && !tag.isBlank()) {
                out.add(tag.trim().toLowerCase(Locale.ROOT));
            }
        }
        return out;
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
