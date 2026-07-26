package com.recall.controller;

import com.recall.dto.FeedbackRequest;
import com.recall.entity.Solution;
import com.recall.service.SolutionService;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Feedback lives on its own top-level path because a client applying feedback knows the
 * solution id but not necessarily the error it belongs to.
 */
@RestController
@RequestMapping("/api/solutions")
public class SolutionController {

    private final SolutionService solutionService;

    public SolutionController(SolutionService solutionService) {
        this.solutionService = solutionService;
    }

    /** PATCH rather than POST: this mutates counters/score on an existing solution. */
    @PatchMapping("/{id}/feedback")
    public Solution applyFeedback(@PathVariable Long id, @RequestBody FeedbackRequest request) {
        return solutionService.applyFeedback(id, request);
    }
}
