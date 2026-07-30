package com.recall.config;

import com.recall.dto.DebugSessionRequest;
import com.recall.dto.SolutionRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.entity.Language;
import com.recall.entity.Project;
import com.recall.repository.DebugSessionRepository;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.ErrorRelationRepository;
import com.recall.repository.LanguageRepository;
import com.recall.repository.ProjectRepository;
import com.recall.repository.SolutionRepository;
import com.recall.service.DebugSessionService;
import com.recall.service.ErrorRecordService;
import com.recall.service.IndexBootstrapService;
import com.recall.service.SolutionService;
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
    private final SolutionService solutionService;
    private final DebugSessionService debugSessionService;
    private final IndexBootstrapService indexBootstrapService;

    public SampleDataLoader(ErrorRecordRepository errorRecordRepository,
                            ErrorRelationRepository errorRelationRepository,
                            SolutionRepository solutionRepository,
                            DebugSessionRepository debugSessionRepository,
                            ProjectRepository projectRepository,
                            LanguageRepository languageRepository,
                            ErrorRecordService errorRecordService,
                            SolutionService solutionService,
                            DebugSessionService debugSessionService,
                            IndexBootstrapService indexBootstrapService) {
        this.errorRecordRepository = errorRecordRepository;
        this.errorRelationRepository = errorRelationRepository;
        this.solutionRepository = solutionRepository;
        this.debugSessionRepository = debugSessionRepository;
        this.projectRepository = projectRepository;
        this.languageRepository = languageRepository;
        this.errorRecordService = errorRecordService;
        this.solutionService = solutionService;
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

    public synchronized void seedData() {
        log.info("Starting sample data population...");

        // 0. Seed Projects & Languages
        Arrays.asList("auth-service", "api-gateway", "payment-processor", "desktop-app", "analytics-engine", "notification-service", "billing-api")
                .forEach(name -> {
                    if (!projectRepository.existsByNameIgnoreCase(name)) {
                        projectRepository.save(new Project(name));
                    }
                });

        Arrays.asList("TypeScript", "JavaScript", "Java", "Python", "Go", "Rust", "C#", "C++")
                .forEach(name -> {
                    if (!languageRepository.existsByNameIgnoreCase(name)) {
                        languageRepository.save(new Language(name));
                    }
                });

        // 1. UserAuthService NPE
        ErrorRecord e1 = new ErrorRecord();
        e1.setSignature("NullPointerException in UserAuthService.authenticate");
        e1.setMessage("java.lang.NullPointerException: Cannot invoke \"com.recall.entity.User.getPasswordHash()\" because \"user\" is null at com.auth.UserAuthService.authenticate(UserAuthService.java:42)");
        e1.setProject("auth-service");
        e1.setLanguage("Java");
        e1.setTags(Arrays.asList("null-pointer", "authentication", "spring-boot", "java", "security"));
        e1 = errorRecordService.create(e1);

        solutionService.create(e1.getId(), new SolutionRequest(
                "Add null check on user repository lookup before attempting password verification. Return Optional.empty() for unknown users.",
                18, 1, LocalDateTime.now().minusDays(1), 4.9
        ));
        solutionService.create(e1.getId(), new SolutionRequest(
                "Use Spring Security UserDetailsService with custom UserNotFoundException mapper.",
                10, 2, LocalDateTime.now().minusDays(4), 4.6
        ));

        // 2. JWTTokenProvider NPE
        ErrorRecord e2 = new ErrorRecord();
        e2.setSignature("NullPointer in JWTTokenProvider.validateClaims");
        e2.setMessage("java.lang.NullPointerException: Token claims map is null when parsing bearer header at com.auth.JWTTokenProvider.validateClaims(JWTTokenProvider.java:88)");
        e2.setProject("api-gateway");
        e2.setLanguage("Java");
        e2.setTags(Arrays.asList("null-pointer", "jwt", "security", "auth", "java"));
        e2 = errorRecordService.create(e2);

        solutionService.create(e2.getId(), new SolutionRequest(
                "Inject DefaultJwtParser with mandatory signing key validation and non-null claim extraction fallback.",
                14, 0, LocalDateTime.now().minusDays(2), 4.85
        ));
        solutionService.create(e2.getId(), new SolutionRequest(
                "Check for empty Bearer token prefix in HTTP authorization header filter prior to claim parsing.",
                9, 1, LocalDateTime.now().minusDays(5), 4.5
        ));

        // 3. HikariPool ConnectionTimeoutException
        ErrorRecord e3 = new ErrorRecord();
        e3.setSignature("HikariPool ConnectionTimeoutException in TransactionManager");
        e3.setMessage("org.hibernate.exception.JDBCConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms at com.recall.service.PaymentService.processBatch(PaymentService.java:112)");
        e3.setProject("payment-processor");
        e3.setLanguage("Java");
        e3.setTags(Arrays.asList("hikaricp", "database", "jdbc", "timeout", "hibernate", "spring-boot"));
        e3 = errorRecordService.create(e3);

        solutionService.create(e3.getId(), new SolutionRequest(
                "Increase HikariCP maximumPoolSize from 10 to 30 and set leakDetectionThreshold to 2000ms.",
                24, 2, LocalDateTime.now().minusHours(12), 4.95
        ));
        solutionService.create(e3.getId(), new SolutionRequest(
                "Ensure all @Transactional methods release connections before executing external HTTP payment gateway calls.",
                19, 1, LocalDateTime.now().minusDays(3), 4.85
        ));

        // 4. CorsPreflightFailedException
        ErrorRecord e4 = new ErrorRecord();
        e4.setSignature("CorsPreflightFailedException in WebSecurityConfig");
        e4.setMessage("Access to fetch at 'http://localhost:8080/api/errors' from origin 'http://localhost:5173' blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.");
        e4.setProject("desktop-app");
        e4.setLanguage("TypeScript");
        e4.setTags(Arrays.asList("cors", "electron", "vite", "http", "api", "typescript"));
        e4 = errorRecordService.create(e4);

        solutionService.create(e4.getId(), new SolutionRequest(
                "Add @CrossOrigin(origins = \"*\") to REST controllers or configure WebCorsConfig CorsRegistry mapping for /api/**.",
                22, 0, LocalDateTime.now().minusDays(1), 5.0
        ));
        solutionService.create(e4.getId(), new SolutionRequest(
                "Route fetch requests through IPC bridge in Electron main process to bypass browser CORS origin restrictions.",
                15, 2, LocalDateTime.now().minusDays(6), 4.7
        ));

        // 5. Metaspace OutOfMemoryError
        ErrorRecord e5 = new ErrorRecord();
        e5.setSignature("OutOfMemoryError: Metaspace GC Overhead Exceeded");
        e5.setMessage("java.lang.OutOfMemoryError: Metaspace limit reached during dynamic CGLIB class loading & bytecode generation at com.recall.engine.DynamicClassCompiler.compile(DynamicClassCompiler.java:77)");
        e5.setProject("analytics-engine");
        e5.setLanguage("Java");
        e5.setTags(Arrays.asList("memory-leak", "jvm", "gc", "metaspace", "java", "performance"));
        e5 = errorRecordService.create(e5);

        solutionService.create(e5.getId(), new SolutionRequest(
                "Increase JVM start parameters to -XX:MaxMetaspaceSize=512m and enable -XX:+ClassUnloadingWithConcurrentMark.",
                16, 1, LocalDateTime.now().minusDays(2), 4.75
        ));

        // 6. ConcurrentModificationException
        ErrorRecord e6 = new ErrorRecord();
        e6.setSignature("ConcurrentModificationException in CacheManager.evict");
        e6.setMessage("java.util.ConcurrentModificationException: Modified underlying cache hash map during multi-threaded iteration at com.recall.cache.CacheManager.evictExpired(CacheManager.java:54)");
        e6.setProject("auth-service");
        e6.setLanguage("Java");
        e6.setTags(Arrays.asList("concurrency", "cache", "java", "threads", "null-pointer"));
        e6 = errorRecordService.create(e6);

        solutionService.create(e6.getId(), new SolutionRequest(
                "Replace standard HashMap with ConcurrentHashMap and use keySet().removeIf() for atomic thread-safe eviction.",
                13, 0, LocalDateTime.now().minusDays(1), 4.85
        ));

        // 7. UnhandledPromiseRejection
        ErrorRecord e7 = new ErrorRecord();
        e7.setSignature("UnhandledPromiseRejection: Failed to fetch IPC bridge response");
        e7.setMessage("TypeError: Cannot read properties of undefined (reading 'errorRecordIds') at SessionLogger.tsx:42 in desktop-app renderer process");
        e7.setProject("desktop-app");
        e7.setLanguage("TypeScript");
        e7.setTags(Arrays.asList("electron", "typescript", "null-pointer", "react", "ipc"));
        e7 = errorRecordService.create(e7);

        solutionService.create(e7.getId(), new SolutionRequest(
                "Add safe optional chaining session.errorRecordIds?.length ?? (session.errorRecordId ? 1 : 0) in React component.",
                20, 0, LocalDateTime.now().minusHours(4), 4.95
        ));

        // 8. DeadlockDetectedException
        ErrorRecord e8 = new ErrorRecord();
        e8.setSignature("DeadlockDetectedException in SQLServerTransaction");
        e8.setMessage("com.microsoft.sqlserver.jdbc.SQLServerException: Transaction (Process ID 68) was deadlocked on lock resources with another process and has been chosen as the deadlock victim.");
        e8.setProject("payment-processor");
        e8.setLanguage("Java");
        e8.setTags(Arrays.asList("database", "deadlock", "sql", "concurrency", "jdbc"));
        e8 = errorRecordService.create(e8);

        solutionService.create(e8.getId(), new SolutionRequest(
                "Enforce strict alphabetical table locking order across all multi-table update transactions.",
                17, 1, LocalDateTime.now().minusDays(2), 4.9
        ));

        // Seed manual relations if not present
        try {
            errorRelationRepository.save(new ErrorRelation(e1.getId(), e2.getId(), "MANUAL"));
            errorRelationRepository.save(new ErrorRelation(e3.getId(), e8.getId(), "MANUAL"));
            errorRelationRepository.save(new ErrorRelation(e4.getId(), e7.getId(), "MANUAL"));
        } catch (Exception ex) {
            log.warn("Manual relations seeding note: {}", ex.getMessage());
        }

        // Seed Sample Debugging Sessions
        try {
            debugSessionService.create(new DebugSessionRequest(
                    e1.getId(),
                    "auth-service",
                    "Traced NPE to missing user record handling during login flow. Applied Optional check in UserAuthService.",
                    LocalDateTime.now().minusDays(1),
                    "Fixed in PR #104. 100% unit test coverage."
            ));

            debugSessionService.create(new DebugSessionRequest(
                    e3.getId(),
                    "payment-processor",
                    "Identified thread connection leaks in batch processing. Increased pool size and configured leak detection.",
                    LocalDateTime.now().minusHours(14),
                    "Connection pool metrics stable at 15% utilization under load."
            ));

            debugSessionService.create(new DebugSessionRequest(
                    e7.getId(),
                    "desktop-app",
                    "Safe optional chaining added to SessionLogger component for undefined error record arrays.",
                    LocalDateTime.now().minusHours(3),
                    "Verified clean render on desktop client."
            ));
        } catch (Exception ex) {
            log.warn("Debug sessions seeding note: {}", ex.getMessage());
        }

        // Rebuild in-memory indexes
        indexBootstrapService.rebuild();

        log.info("Sample data seeding successfully completed! 8 ErrorRecords, 13 Solutions, 3 Relations, and 3 Debug Sessions created.");
    }
}
