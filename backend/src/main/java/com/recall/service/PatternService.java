package com.recall.service;

import com.recall.dto.PatternDto;
import com.recall.dto.PatternExampleDto;
import com.recall.entity.ErrorRecord;
import com.recall.repository.ErrorRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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

    @Transactional(readOnly = true)
    public List<PatternDto> findPatterns() {
        List<Set<Long>> clusters = graphService.crossProjectComponents();
        if (clusters.isEmpty()) {
            return new ArrayList<>();
        }

        List<PatternDto> patternsList = new ArrayList<>();

        for (Set<Long> clusterIds : clusters) {
            List<Long> idList = new ArrayList<>(clusterIds);
            Iterable<ErrorRecord> dbRecords = errorRecordRepository.findAllById(idList);
            
            List<ErrorRecord> records = new ArrayList<>();
            for (ErrorRecord r : dbRecords) {
                if (r != null) {
                    records.add(r);
                }
            }

            if (records.isEmpty()) {
                continue;
            }

            String tag = dominantTag(records);

            Set<String> uniqueProjects = new HashSet<>();
            for (ErrorRecord record : records) {
                String project = record.getProject();
                if (project != null && !project.trim().isEmpty()) {
                    uniqueProjects.add(project.trim());
                }
            }

            records.sort(new Comparator<ErrorRecord>() {
                @Override
                public int compare(ErrorRecord r1, ErrorRecord r2) {
                    if (r1.getCreatedAt() != null && r2.getCreatedAt() != null) {
                        int dateCompare = r2.getCreatedAt().compareTo(r1.getCreatedAt());
                        if (dateCompare != 0) {
                            return dateCompare;
                        }
                    } else if (r1.getCreatedAt() != null) {
                        return -1;
                    } else if (r2.getCreatedAt() != null) {
                        return 1;
                    }

                    if (r1.getId() != null && r2.getId() != null) {
                        return r1.getId().compareTo(r2.getId());
                    }
                    return 0;
                }
            });

            List<PatternExampleDto> exampleDtos = new ArrayList<>();
            for (int i = 0; i < records.size() && i < MAX_EXAMPLES; i++) {
                ErrorRecord record = records.get(i);
                exampleDtos.add(new PatternExampleDto(
                        record.getId(),
                        record.getSignature(),
                        record.getMessage(),
                        record.getProject(),
                        record.getLanguage()
                ));
            }

            patternsList.add(new PatternDto(tag, uniqueProjects.size(), records.size(), exampleDtos));
        }

        patternsList.sort(new Comparator<PatternDto>() {
            @Override
            public int compare(PatternDto p1, PatternDto p2) {
                int projDiff = Integer.compare(p2.projectCount(), p1.projectCount());
                if (projDiff != 0) {
                    return projDiff;
                }
                int occDiff = Integer.compare(p2.occurrenceCount(), p1.occurrenceCount());
                if (occDiff != 0) {
                    return occDiff;
                }
                if (p1.tag() != null && p2.tag() != null) {
                    return p1.tag().compareTo(p2.tag());
                }
                return 0;
            }
        });

        return patternsList;
    }

    private static String dominantTag(List<ErrorRecord> records) {
        Map<String, Integer> tagCounts = new HashMap<>();

        for (ErrorRecord record : records) {
            List<String> tags = record.getTags();
            if (tags == null) {
                continue;
            }

            Set<String> uniqueTagsInRecord = new HashSet<>();
            for (String rawTag : tags) {
                if (rawTag != null && !rawTag.trim().isEmpty()) {
                    uniqueTagsInRecord.add(rawTag.trim().toLowerCase(Locale.ROOT));
                }
            }

            for (String tag : uniqueTagsInRecord) {
                int current = tagCounts.getOrDefault(tag, 0);
                tagCounts.put(tag, current + 1);
            }
        }

        if (!tagCounts.isEmpty()) {
            String dominant = UNTAGGED;
            int maxCount = -1;

            for (Map.Entry<String, Integer> entry : tagCounts.entrySet()) {
                String tag = entry.getKey();
                int count = entry.getValue();

                if (count > maxCount || (count == maxCount && tag.compareTo(dominant) > 0)) {
                    maxCount = count;
                    dominant = tag;
                }
            }
            return dominant;
        }

        String commonLanguage = null;
        for (ErrorRecord record : records) {
            String lang = record.getLanguage();
            if (lang == null || lang.trim().isEmpty()) {
                return UNTAGGED;
            }
            String normalizedLang = lang.trim().toLowerCase(Locale.ROOT);
            if (commonLanguage == null) {
                commonLanguage = normalizedLang;
            } else if (!commonLanguage.equals(normalizedLang)) {
                return UNTAGGED;
            }
        }

        return commonLanguage == null ? UNTAGGED : commonLanguage;
    }
}


