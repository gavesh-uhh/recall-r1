package com.recall.service;

import com.recall.dto.PatternDto;
import com.recall.dto.PatternExampleDto;
import com.recall.entity.ErrorRecord;
import com.recall.repository.ErrorRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

// Service for discovering cross-project debugging patterns and error clusters
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

    // Find cross-project error clusters and format them into PatternDto results
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

            // Sort examples by timestamp (newest first) with ID fallback
            records.sort(Comparator
                    .comparing(ErrorRecord::getCreatedAt,
                            Comparator.nullsLast(Comparator.reverseOrder()))
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

        // Rank patterns by project count, occurrence count, and tag name
        patterns.sort(Comparator
                .comparingInt(PatternDto::projectCount).reversed()
                .thenComparing(Comparator.comparingInt(PatternDto::occurrenceCount).reversed())
                .thenComparing(PatternDto::tag, Comparator.nullsLast(Comparator.naturalOrder())));

        return patterns;
    }

    // Determine the most common tag across errors in a cluster
    private static String dominantTag(List<ErrorRecord> records) {
        // Count tags (deduplicated per record so one error record only votes once)
        Map<String, Long> counts = records.stream()
                .map(ErrorRecord::getTags)
                .filter(Objects::nonNull)
                .flatMap(tags -> tags.stream()
                        .filter(rawTag -> rawTag != null && !rawTag.isBlank())
                        .map(rawTag -> rawTag.trim().toLowerCase(Locale.ROOT))
                        .distinct())
                .collect(Collectors.groupingBy(tag -> tag, Collectors.counting()));

        if (!counts.isEmpty()) {
            return counts.entrySet().stream()
                    .max(Map.Entry.<String, Long>comparingByValue()
                            .thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder())))
                    .map(Map.Entry::getKey)
                    .orElse(UNTAGGED);
        }

        // Fallback to common language if all records share the same language
        String language = null;
        for (ErrorRecord record : records) {
            String candidate = record.getLanguage();
            if (candidate == null || candidate.isBlank()) {
                return UNTAGGED;
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
