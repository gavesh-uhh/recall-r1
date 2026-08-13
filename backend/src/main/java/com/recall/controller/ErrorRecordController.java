package com.recall.controller;

import com.recall.dto.RankedSolutionDto;
import com.recall.dto.RelationRequest;
import com.recall.dto.SolutionRequest;
import com.recall.dto.SignatureMatchDto;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import com.recall.entity.Solution;
import com.recall.service.ErrorRecordService;
import com.recall.service.GraphService;
import com.recall.service.SolutionService;
import com.recall.service.FuzzyMatchService;
import com.recall.service.MatchResult;
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

@RestController
@RequestMapping("/api/errors")
public class ErrorRecordController {

    private final ErrorRecordService errorRecordService;
    private final SolutionService solutionService;
    private final GraphService graphService;
    private final FuzzyMatchService fuzzyMatchService;
    private final com.recall.config.SampleDataLoader sampleDataLoader;

    public ErrorRecordController(ErrorRecordService errorRecordService,
                                 SolutionService solutionService,
                                 GraphService graphService,
                                 FuzzyMatchService fuzzyMatchService,
                                 com.recall.config.SampleDataLoader sampleDataLoader) {
        this.errorRecordService = errorRecordService;
        this.solutionService = solutionService;
        this.graphService = graphService;
        this.fuzzyMatchService = fuzzyMatchService;
        this.sampleDataLoader = sampleDataLoader;
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedSampleData() {
        sampleDataLoader.forceSeedData();
        return ResponseEntity.ok("Sample data seeded successfully.");
    }

    @PostMapping("/clear")
    public ResponseEntity<String> clearAllData() {
        sampleDataLoader.clearAllData();
        return ResponseEntity.ok("All data cleared successfully.");
    }

    @PostMapping
    public ResponseEntity<ErrorRecord> create(@RequestBody ErrorRecord newErrorRecord) {
        ErrorRecord created = errorRecordService.create(newErrorRecord);
        return ResponseEntity
                .created(URI.create("/api/errors/" + created.getId()))
                .body(created);
    }

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

    @GetMapping("/{id}/related")
    public List<ErrorRecord> related(@PathVariable Long id,
                                     @RequestParam(required = false) Integer depth) {
        return graphService.findRelated(id, depth);
    }

    @GetMapping("/{id}/signature-matching")
    public ResponseEntity<SignatureMatchDto> signatureMatching(@PathVariable Long id) {
        MatchResult result = fuzzyMatchService.getMatchResult(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        SignatureMatchDto dto = new SignatureMatchDto();
        
        ErrorRecord currentRecord = errorRecordService.findById(id).orElse(null);
        if (currentRecord != null) {
            dto.setCurrentSignature(currentRecord.getSignature());
        } else {
            dto.setCurrentSignature(result.getCurrentSignature());
        }
        
        dto.setPrefixThreshold(result.getPrefixThreshold());
        dto.setMatchOccurred(result.isLinked());
        dto.setMatchedErrorId(result.getErrorId());
        dto.setRelationshipType(result.getRelationshipType());

        if (result.getPredecessorId() != null) {
            SignatureMatchDto.Candidate pred = new SignatureMatchDto.Candidate();
            pred.setErrorId(result.getPredecessorId());
            pred.setSimilarity(result.getPredecessorSimilarity());
            ErrorRecord predRecord = errorRecordService.findById(result.getPredecessorId()).orElse(null);
            pred.setErrorSignature(predRecord != null ? predRecord.getSignature() : result.getPredecessorSignature());
            dto.setPredecessor(pred);
        }

        if (result.getSuccessorId() != null) {
            SignatureMatchDto.Candidate succ = new SignatureMatchDto.Candidate();
            succ.setErrorId(result.getSuccessorId());
            succ.setSimilarity(result.getSuccessorSimilarity());
            ErrorRecord succRecord = errorRecordService.findById(result.getSuccessorId()).orElse(null);
            succ.setErrorSignature(succRecord != null ? succRecord.getSignature() : result.getSuccessorSignature());
            dto.setSuccessor(succ);
        }

        return ResponseEntity.ok(dto);
    }
}
