package com.recall.service;

import com.recall.config.RecallProperties;
import com.recall.dto.FeedbackRequest;
import com.recall.dto.RankedSolutionDto;
import com.recall.dto.SolutionRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.Solution;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.SolutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Plain unit tests — repositories mocked, no Spring context. */
class SolutionServiceTest {

    private SolutionRepository solutionRepository;
    private ErrorRecordRepository errorRecordRepository;
    private SolutionService service;

    @BeforeEach
    void setUp() {
        solutionRepository = mock(SolutionRepository.class);
        errorRecordRepository = mock(ErrorRecordRepository.class);
        // Real properties: the ranking path under test uses the production weights/lambda.
        service = new SolutionService(solutionRepository, errorRecordRepository, new RecallProperties());
        when(solutionRepository.save(any(Solution.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static ErrorRecord error(long id) {
        ErrorRecord e = new ErrorRecord();
        e.setId(id);
        e.setSignature("NullPointerException in UserAuthService.authenticate");
        return e;
    }

    @Test
    @DisplayName("a newly created solution always starts with zero history")
    void createStartsWithZeroHistory() {
        when(errorRecordRepository.findById(1L)).thenReturn(Optional.of(error(1L)));

        Solution created = service.create(1L, new SolutionRequest("Add null check"));

        assertEquals("Add null check", created.getDescription());
        assertEquals(0, created.getSuccessCount());
        assertEquals(0, created.getFailureCount());
        assertEquals(0.0, created.getFeedbackScore(), 1e-12);
        assertEquals(0, created.getRatingCount());
        assertNull(created.getLastSuccessDate());
        assertEquals(0, created.getUsageCount());
    }

    @Test
    @DisplayName("success feedback bumps successCount and stamps lastSuccessDate")
    void feedbackSuccessIncrementsSuccess() {
        Solution fresh = new Solution();
        when(solutionRepository.findById(7L)).thenReturn(Optional.of(fresh));

        Solution updated = service.applyFeedback(7L, new FeedbackRequest(true, null));

        assertEquals(1, updated.getSuccessCount());
        assertEquals(0, updated.getFailureCount());
        assertNotNull(updated.getLastSuccessDate());
    }

    @Test
    @DisplayName("failure feedback bumps failureCount and never touches lastSuccessDate")
    void feedbackFailureLeavesLastSuccessNull() {
        Solution fresh = new Solution();
        when(solutionRepository.findById(7L)).thenReturn(Optional.of(fresh));

        Solution updated = service.applyFeedback(7L, new FeedbackRequest(false, null));

        assertEquals(0, updated.getSuccessCount());
        assertEquals(1, updated.getFailureCount());
        assertNull(updated.getLastSuccessDate());
    }

    @Test
    @DisplayName("ratings fold into the running average one observation at a time")
    void ratingsFoldIntoRunningAverage() {
        Solution fresh = new Solution();
        when(solutionRepository.findById(7L)).thenReturn(Optional.of(fresh));

        service.applyFeedback(7L, new FeedbackRequest(null, 5.0));
        assertEquals(5.0, fresh.getFeedbackScore(), 1e-9);
        assertEquals(1, fresh.getRatingCount());

        service.applyFeedback(7L, new FeedbackRequest(null, 3.0));
        assertEquals(4.0, fresh.getFeedbackScore(), 1e-9);
        assertEquals(2, fresh.getRatingCount());
    }

    @Test
    @DisplayName("a zero-history solution ranks with a finite, valid score of 0")
    void rankingZeroHistoryYieldsFiniteScore() {
        when(errorRecordRepository.existsById(1L)).thenReturn(true);
        Solution fresh = new Solution();
        fresh.setId(9L);
        when(solutionRepository.findByErrorRecordId(1L)).thenReturn(List.of(fresh));

        List<RankedSolutionDto> ranked = service.getRankedSolutions(1L);

        assertEquals(1, ranked.size());
        double score = ranked.get(0).decayScore();
        assertFalse(Double.isNaN(score), "score must not be NaN");
        assertFalse(Double.isInfinite(score), "score must not be infinite");
        assertEquals(0.0, score, 1e-12, "no attempts and no last success must score 0");
    }
}
