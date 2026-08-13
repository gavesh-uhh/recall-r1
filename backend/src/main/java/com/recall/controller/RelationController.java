package com.recall.controller;

import com.recall.dto.RelationRequest;
import com.recall.entity.ErrorRelation;
import com.recall.service.GraphService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relations")
public class RelationController {

    private final GraphService graphService;

    public RelationController(GraphService graphService) {
        this.graphService = graphService;
    }

    @PostMapping
    public ResponseEntity<ErrorRelation> createRelation(@RequestBody RelationRequest request) {
        if (request == null || request.sourceErrorId() == null) {
            throw new IllegalArgumentException("sourceErrorId is required for POST /api/relations");
        }
        ErrorRelation created = graphService.addManualRelation(request.sourceErrorId(), request);
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    public List<ErrorRelation> getAllRelations() {
        return graphService.findAllRelations();
    }
}

