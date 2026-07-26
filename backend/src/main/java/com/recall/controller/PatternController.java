package com.recall.controller;

import com.recall.dto.PatternDto;
import com.recall.service.PatternService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Read-only view over the cross-project clusters derived from the error graph. */
@RestController
@RequestMapping("/api/patterns")
public class PatternController {

    private final PatternService patternService;

    public PatternController(PatternService patternService) {
        this.patternService = patternService;
    }

    @GetMapping
    public List<PatternDto> findPatterns() {
        return patternService.findPatterns();
    }
}
