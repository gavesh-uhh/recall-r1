package com.recall.config;

import com.recall.dto.DebugSessionRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.entity.Language;
import com.recall.entity.Project;
import com.recall.entity.Solution;
import com.recall.repository.DebugSessionRepository;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.ErrorRelationRepository;
import com.recall.repository.LanguageRepository;
import com.recall.repository.ProjectRepository;
import com.recall.repository.SolutionRepository;
import com.recall.service.DebugSessionService;
import com.recall.service.ErrorRecordService;
import com.recall.service.IndexBootstrapService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Seeds rich sample data into the Recall R1 database on application startup if empty,
 * or on demand via seed endpoint. Also provides clear/reset capability.
 */
@Component
public class SampleDataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleDataLoader.class);

    private final ErrorRecordRepository errorRecordRepository;
    private final ErrorRelationRepository errorRelationRepository;
    private final SolutionRepository solutionRepository;
    private final DebugSessionRepository debugSessionRepository;
    private final ProjectRepository projectRepository;
    private final LanguageRepository languageRepository;
    private final ErrorRecordService errorRecordService;
    private final DebugSessionService debugSessionService;
    private final IndexBootstrapService indexBootstrapService;

    public SampleDataLoader(ErrorRecordRepository errorRecordRepository,
                            ErrorRelationRepository errorRelationRepository,
                            SolutionRepository solutionRepository,
                            DebugSessionRepository debugSessionRepository,
                            ProjectRepository projectRepository,
                            LanguageRepository languageRepository,
                            ErrorRecordService errorRecordService,
                            DebugSessionService debugSessionService,
                            IndexBootstrapService indexBootstrapService) {
        this.errorRecordRepository = errorRecordRepository;
        this.errorRelationRepository = errorRelationRepository;
        this.solutionRepository = solutionRepository;
        this.debugSessionRepository = debugSessionRepository;
        this.projectRepository = projectRepository;
        this.languageRepository = languageRepository;
        this.errorRecordService = errorRecordService;
        this.debugSessionService = debugSessionService;
        this.indexBootstrapService = indexBootstrapService;
    }

    @Override
    public void run(String... args) {
        if (errorRecordRepository.count() == 0) {
            log.info("Database is empty. Seeding initial sample data...");
            seedData();
        } else {
            log.info("Database contains {} error records.", errorRecordRepository.count());
        }
    }

    @Transactional
    public synchronized void clearAllData() {
        log.info("Clearing all records, solutions, relations, sessions, projects, and languages from database...");
        solutionRepository.deleteAll();
        errorRelationRepository.deleteAll();
        debugSessionRepository.deleteAll();
        errorRecordRepository.deleteAll();
        projectRepository.deleteAll();
        languageRepository.deleteAll();
        indexBootstrapService.rebuild();
        log.info("Database and in-memory indexes cleared successfully.");
    }

    public synchronized void forceSeedData() {
        clearAllData();
        seedData();
    }

    /**
     * Seeds a solution WITH pre-existing history, built directly at the entity level.
     * This is deliberately kept off the user-facing create path ({@code SolutionRequest} /
     * {@code SolutionService.create}), where new solutions always start with zero history.
     * Historical values exist here only so demos/fixtures can showcase ranking immediately.
     */
    private void seedSolution(ErrorRecord error, String description, int successCount, int failureCount,
                              LocalDateTime lastSuccessDate, double feedbackScore) {
        Solution solution = new Solution();
        solution.setErrorRecord(error);
        solution.setDescription(description);
        solution.setSuccessCount(successCount);
        solution.setFailureCount(failureCount);
        solution.setLastSuccessDate(lastSuccessDate);
        solution.setFeedbackScore(feedbackScore);
        // A seeded score counts as one observation so later ratings average against it sensibly.
        solution.setRatingCount(feedbackScore > 0.0 ? 1 : 0);
        solutionRepository.save(solution);
    }

    public synchronized void seedData() {
        log.info("Starting minimal sample data population...");

        // 0. Seed Projects & Languages
        Arrays.asList("auth-service", "payment-processor")
                .forEach(name -> {
                    if (!projectRepository.existsByNameIgnoreCase(name)) {
                        projectRepository.save(new Project(name));
                    }
                });

        Arrays.asList("Java", "Python")
                .forEach(name -> {
                    if (!languageRepository.existsByNameIgnoreCase(name)) {
                        languageRepository.save(new Language(name));
                    }
                });

        // 1. UserAuthService NPE
        ErrorRecord e1 = new ErrorRecord();
        e1.setMessage("java.lang.NullPointerException: Cannot invoke getPasswordHash() at com.auth.UserAuthService.authenticate");
        e1.setProject("auth-service");
        e1.setLanguage("Java");
        e1.setTags(Arrays.asList("null-pointer", "authentication", "java"));
        e1 = errorRecordService.create(e1);

        seedSolution(e1,
                "Add null check on user repository lookup before attempting password verification.",
                18, 1, LocalDateTime.now().minusDays(1), 4.9
        );

        // 2. JWTTokenProvider NPE (Similar signature to e1, will link via SIGNATURE_MATCH)
        ErrorRecord e2 = new ErrorRecord();
        e2.setMessage("java.lang.NullPointerException: Token claims map is null");
        e2.setProject("auth-service");
        e2.setLanguage("Java");
        e2.setTags(Arrays.asList("null-pointer", "jwt", "java"));
        e2 = errorRecordService.create(e2);

        seedSolution(e2,
                "Inject DefaultJwtParser with mandatory signing key validation.",
                14, 0, LocalDateTime.now().minusDays(2), 4.85
        );

        // 3. PaymentTimeout (Will link via MANUAL relation)
        ErrorRecord e3 = new ErrorRecord();
        e3.setMessage("HikariPool-1 - Connection is not available, request timed out");
        e3.setProject("payment-processor");
        e3.setLanguage("Java");
        e3.setTags(Arrays.asList("timeout", "database", "java"));
        e3 = errorRecordService.create(e3);

        seedSolution(e3,
                "Increase HikariCP maximumPoolSize and set leakDetectionThreshold.",
                24, 2, LocalDateTime.now().minusHours(12), 4.95
        );

        // Seed manual relations
        try {
            errorRelationRepository.save(new ErrorRelation(e1.getId(), e3.getId(), "MANUAL"));
        } catch (Exception ex) {
            log.warn("Manual relations seeding note: {}", ex.getMessage());
        }

        // Rebuild in-memory indexes
        indexBootstrapService.rebuild();

        log.info("Minimal sample data seeding completed!");
    }
}
