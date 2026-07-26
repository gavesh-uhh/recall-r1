package com.recall.controller;

import com.recall.service.IndexBootstrapService;
import com.recall.service.IndexRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Liveness and index maintenance. Deliberately not under a shared {@code @RequestMapping}
 * because {@code /api/health} is polled by the Electron shell at startup and should stay
 * on a short, stable path independent of the admin namespace.
 */
@RestController
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final IndexRegistry indexRegistry;
    private final IndexBootstrapService indexBootstrapService;

    public AdminController(IndexRegistry indexRegistry, IndexBootstrapService indexBootstrapService) {
        this.indexRegistry = indexRegistry;
        this.indexBootstrapService = indexBootstrapService;
    }

    /**
     * Never throws: the Electron launcher treats any non-200 as "backend not up yet" and keeps
     * waiting, so a transient failure reading the staleness flag must not stall startup. A
     * failed read is reported as {@code indexStale: true}, which is the conservative answer.
     */
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        boolean stale = true;
        try {
            stale = indexRegistry.isStale();
        } catch (RuntimeException e) {
            log.warn("Health check could not read index staleness; reporting stale", e);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        body.put("indexStale", stale);
        return body;
    }

    /** Rehydrates the AVL index and error graph from H2. Failures fall through to the 500 handler. */
    @PostMapping("/api/admin/rebuild-index")
    public ResponseEntity<Map<String, Object>> rebuildIndex() {
        indexBootstrapService.rebuild();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "rebuilt");
        return ResponseEntity.ok(body);
    }
}
