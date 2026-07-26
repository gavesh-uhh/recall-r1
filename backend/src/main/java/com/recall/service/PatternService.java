package com.recall.service;

import com.recall.dto.PatternDto;
import com.recall.dto.PatternExampleDto;
import com.recall.entity.ErrorRecord;
import com.recall.repository.ErrorRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Turns cross-project connected components into human-readable "patterns": recurring classes of
 * error that show up in more than one project.
 */
@Service
public class PatternService {

    private static final int MAX_EXAMPLES = 5;
    private static final String UNTAGGED = "untagged";

    private final GraphService graphService;
    private final ErrorRecordRepository errorRecordRepository;

    public PatternService(GraphService graphService, ErrorRecordRepository errorRecordRepository) {
        this.graphService = graphService;
        this.errorRecordRepository = errorRecordRepository;
    }

    /**
     * One {@link PatternDto} per cross-project component, sorted by projectCount desc,
     * occurrenceCount desc, then tag asc — fully deterministic.
     */
    @Transactional(readOnly = true)
    public List<PatternDto> findPatterns() {
        List<Set<Long>> components = graphService.crossProjectComponents();
        if (components.isEmpty()) {
            return List.of();
        }

        List<PatternDto> patterns = new ArrayList<>(components.size());
        for (Set<Long> component : components) {
            List<ErrorRecord> records = new ArrayList<>(
                    errorRecordRepository.findAllById(new ArrayList<>(component)));
            if (records.isEmpty()) {
                continue;
            }

            String tag = dominantTag(records);

            Set<String> projects = new HashSet<>();
            for (ErrorRecord record : records) {
                if (record.getProject() != null && !record.getProject().isBlank()) {
                    projects.add(record.getProject().trim());
                }
            }

            records.sort(Comparator
                    .comparing(ErrorRecord::getCreatedAt,
                            Comparator.nullsLast(Comparator.reverseOrder()))
                    // Stable tie-break so equal timestamps still produce one fixed order.
                    .thenComparing(ErrorRecord::getId, Comparator.nullsLast(Comparator.naturalOrder())));

            List<PatternExampleDto> examples = new ArrayList<>(Math.min(MAX_EXAMPLES, records.size()));
            for (ErrorRecord record : records) {
                if (examples.size() >= MAX_EXAMPLES) {
                    break;
                }
                examples.add(new PatternExampleDto(
                        record.getId(),
                        record.getSignature(),
                        record.getMessage(),
                        record.getProject(),
                        record.getLanguage()));
            }

            patterns.add(new PatternDto(tag, projects.size(), records.size(), examples));
        }

        patterns.sort(Comparator
                .comparingInt(PatternDto::projectCount).reversed()
                .thenComparing(Comparator.comparingInt(PatternDto::occurrenceCount).reversed())
                .thenComparing(PatternDto::tag, Comparator.nullsLast(Comparator.naturalOrder())));

        return patterns;
    }

    /**
     * Most frequent non-blank tag across the component (grouped case-insensitively, alphabetical
     * tie-break). With no tags at all, falls back to the shared language, else {@code "untagged"}.
     */
    private static String dominantTag(List<ErrorRecord> records) {
        Map<String, Integer> counts = new HashMap<>();
        for (ErrorRecord record : records) {
            List<String> tags = record.getTags();
            if (tags == null) {
                continue;
            }
            // De-dupe within a record so one record cannot vote twice for the same tag.
            Set<String> seen = new HashSet<>();
            for (String raw : tags) {
                if (raw == null || raw.isBlank()) {
                    continue;
                }
                String key = raw.trim().toLowerCase(Locale.ROOT);
                if (seen.add(key)) {
                    counts.merge(key, 1, Integer::sum);
                }
            }
        }

        if (!counts.isEmpty()) {
            return counts.entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()
                            .thenComparing(Map.Entry.comparingByKey()))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(UNTAGGED);
        }

        String language = null;
        for (ErrorRecord record : records) {
            String candidate = record.getLanguage();
            if (candidate == null || candidate.isBlank()) {
                return UNTAGGED; // not consistent across the component
            }
            String normalized = candidate.trim().toLowerCase(Locale.ROOT);
            if (language == null) {
                language = normalized;
            } else if (!language.equals(normalized)) {
                return UNTAGGED;
            }
        }
        return language == null ? UNTAGGED : language;
    }
}
