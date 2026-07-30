package com.recall.controller;

import com.recall.dto.RankedSolutionDto;
import com.recall.dto.RelationRequest;
import com.recall.dto.SolutionRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.entity.Solution;
import com.recall.service.ErrorRecordService;
import com.recall.service.GraphService;
import com.recall.service.SolutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Error record CRUD plus the sub-resources that hang off a single error
 * (its solutions, its manual relations, and its graph neighbourhood).
 *
 * <p>Missing entities are reported by throwing {@link NoSuchElementException}, which
 * {@link GlobalExceptionHandler} turns into a 404 — the same path the services use, so
 * the response shape is identical whether the miss was detected here or downstream.
 */
@RestController
@RequestMapping("/api/errors")
public class ErrorRecordController {

    private final ErrorRecordService errorRecordService;
    private final SolutionService solutionService;
    private final GraphService graphService;
    private final com.recall.config.SampleDataLoader sampleDataLoader;

    public ErrorRecordController(ErrorRecordService errorRecordService,
                                 SolutionService solutionService,
                                 GraphService graphService,
                                 com.recall.config.SampleDataLoader sampleDataLoader) {
        this.errorRecordService = errorRecordService;
        this.solutionService = solutionService;
        this.graphService = graphService;
        this.sampleDataLoader = sampleDataLoader;
    }

    /** Force seeds rich sample data into the database (clears first then populates). */
    @PostMapping("/seed")
    public ResponseEntity<String> seedSampleData() {
        sampleDataLoader.forceSeedData();
        return ResponseEntity.ok("Sample data seeded successfully.");
    }

    /** Clears all errors, solutions, relations, and debug sessions from the database. */
    @PostMapping("/clear")
    public ResponseEntity<String> clearAllData() {
        sampleDataLoader.clearAllData();
        return ResponseEntity.ok("All data cleared successfully.");
    }

    /** 201 Created with a {@code Location} header pointing at the new record. */
    @PostMapping
    public ResponseEntity<ErrorRecord> create(@RequestBody ErrorRecord incoming) {
        ErrorRecord created = errorRecordService.create(incoming);
        return ResponseEntity
                .created(URI.create("/api/errors/" + created.getId()))
                .body(created);
    }

    /**
     * Declared ahead of {@code /{id}} for readability; Spring would prefer the literal
     * segment anyway, and {@code {id}} being a {@code Long} means "search" could never bind to it.
     */
    @GetMapping("/search")
    public ErrorRecord findBySignature(@RequestParam String signature) {
        return errorRecordService.findBySignature(signature)
                .orElseThrow(() -> new NoSuchElementException(
                        "No error record with signature '" + signature + "'"));
    }

    @GetMapping
    public List<ErrorRecord> browse(@RequestParam(required = false) String project,
                                    @RequestParam(required = false) String language) {
        return errorRecordService.browse(project, language);
    }

    @GetMapping("/{id}")
    public ErrorRecord findById(@PathVariable Long id) {
        return errorRecordService.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No error record with id " + id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        errorRecordService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/solutions")
    public ResponseEntity<Solution> addSolution(@PathVariable Long id,
                                                @RequestBody SolutionRequest request) {
        Solution created = solutionService.create(id, request);
        return ResponseEntity
                .created(URI.create("/api/solutions/" + created.getId()))
                .body(created);
    }

    /** Ranked by the decay-weighted heap score, which is echoed back as {@code decayScore}. */
    @GetMapping("/{id}/solutions")
    public List<RankedSolutionDto> rankedSolutions(@PathVariable Long id) {
        return solutionService.getRankedSolutions(id);
    }

    @PostMapping("/{id}/relations")
    public ResponseEntity<ErrorRelation> addRelation(@PathVariable Long id,
                                                     @RequestBody RelationRequest request) {
        ErrorRelation created = graphService.addManualRelation(id, request);
        return ResponseEntity.status(201).body(created);
    }

    /** {@code depth} is left null when absent so the service can apply its own default. */
    @GetMapping("/{id}/related")
    public List<ErrorRecord> related(@PathVariable Long id,
                                     @RequestParam(required = false) Integer depth) {
        return graphService.findRelated(id, depth);
    }
}
