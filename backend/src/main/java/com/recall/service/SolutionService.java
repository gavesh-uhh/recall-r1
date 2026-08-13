package com.recall.service;

import com.recall.config.RecallProperties;
import com.recall.datastructure.MaxHeap;
import com.recall.dto.FeedbackRequest;
import com.recall.dto.RankedSolutionDto;
import com.recall.dto.SolutionRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.Solution;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.SolutionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Solution CRUD, decay-weighted ranking, and feedback folding.
 *
 * <p>The ranking heap is built per request rather than kept around: every score depends on
 * "now", so a cached heap would order stale.
 */
@Service
public class SolutionService {

    private static final double MIN_RATING = 0.0;
    private static final double MAX_RATING = 5.0;

    private final SolutionRepository solutionRepository;
    private final ErrorRecordRepository errorRecordRepository;
    private final RecallProperties recallProperties;

    public SolutionService(SolutionRepository solutionRepository,
                           ErrorRecordRepository errorRecordRepository,
                           RecallProperties recallProperties) {
        this.solutionRepository = solutionRepository;
        this.errorRecordRepository = errorRecordRepository;
        this.recallProperties = recallProperties;
    }

    /**
     * Creates a genuinely new solution with zero history. Success/failure counters, ratings, and
     * {@code lastSuccessDate} are earned exclusively through {@link #applyFeedback(Long, FeedbackRequest)}
     * once the fix has actually been tried — never supplied at creation time.
     *
     * @throws NoSuchElementException when {@code errorId} does not exist — the controller layer
     *                                maps this to 404.
     */
    @Transactional
    public Solution create(Long errorId, SolutionRequest req) {
        ErrorRecord error = errorRecordRepository.findById(errorId)
                .orElseThrow(() -> new NoSuchElementException("ErrorRecord not found: " + errorId));

        Solution solution = new Solution();
        solution.setErrorRecord(error);
        solution.setDescription(req == null ? null : req.description());
        solution.setSuccessCount(0);
        solution.setFailureCount(0);
        solution.setLastSuccessDate(null);
        solution.setFeedbackScore(0.0);
        solution.setRatingCount(0);

        return solutionRepository.save(solution);
    }

    /**
     * Ranks the error's solutions with a {@link MaxHeap} built on demand.
     *
     * <p>{@code now} is captured once and reused for both the comparator and the reported
     * {@code decayScore}, so the score in the response always explains the order.
     */
    @Transactional(readOnly = true)
    public List<RankedSolutionDto> getRankedSolutions(Long errorId) {
        // Distinguish "this error has no solutions yet" (empty list) from "no such error" (404):
        // returning an empty list for an unknown id would hide a bad reference from the caller.
        if (!errorRecordRepository.existsById(errorId)) {
            throw new NoSuchElementException("No error record with id " + errorId);
        }

        List<Solution> solutions = solutionRepository.findByErrorRecordId(errorId);
        if (solutions.isEmpty()) {
            return List.of();
        }

        LocalDateTime now = LocalDateTime.now();
        double lambda = recallProperties.getDecay().getLambda();
        double w1 = recallProperties.getHeap().getWeights().getW1();
        double w2 = recallProperties.getHeap().getWeights().getW2();
        double w3 = recallProperties.getHeap().getWeights().getW3();
        double saturation = recallProperties.getHeap().getFrequencySaturation();

        Comparator<Solution> comparator =
                MaxHeap.solutionComparator(lambda, w1, w2, w3, saturation, now);
        MaxHeap<Solution> heap = new MaxHeap<>(comparator);
        heap.heapify(new ArrayList<>(solutions));

        List<Solution> ordered = heap.drainSorted();
        List<RankedSolutionDto> out = new ArrayList<>(ordered.size());
        for (Solution s : ordered) {
            double score = MaxHeap.scoreOf(s, lambda, w1, w2, w3, saturation, now);
            out.add(new RankedSolutionDto(
                    s.getId(),
                    s.getErrorRecordId(),
                    s.getDescription(),
                    s.getSuccessCount(),
                    s.getFailureCount(),
                    s.getLastSuccessDate(),
                    s.getFeedbackScore(),
                    score));
        }
        return out;
    }

    /**
     * Folds a usage outcome and/or a rating into the solution.
     *
     * <p>{@code success == TRUE} bumps {@code successCount} and refreshes {@code lastSuccessDate};
     * {@code success == FALSE} bumps {@code failureCount} only. A non-null {@code rating} (clamped
     * to 0..5) is folded into the running average via
     * {@code (oldAvg*oldCount + rating) / (oldCount + 1)}.
     *
     * @throws NoSuchElementException when the solution does not exist.
     */
    @Transactional
    public Solution applyFeedback(Long solutionId, FeedbackRequest req) {
        Solution solution = solutionRepository.findById(solutionId)
                .orElseThrow(() -> new NoSuchElementException("Solution not found: " + solutionId));

        if (req != null) {
            if (Boolean.TRUE.equals(req.success())) {
                solution.setSuccessCount(solution.getSuccessCount() + 1);
                solution.setLastSuccessDate(LocalDateTime.now());
            } else if (Boolean.FALSE.equals(req.success())) {
                // A failure must not touch lastSuccessDate — decay is measured from the last win.
                solution.setFailureCount(solution.getFailureCount() + 1);
            }

            if (req.rating() != null) {
                double rating = clampRating(req.rating());
                int oldCount = Math.max(0, solution.getRatingCount());
                double oldAvg = solution.getFeedbackScore();
                double newAvg = (oldAvg * oldCount + rating) / (oldCount + 1);
                solution.setFeedbackScore(newAvg);
                solution.setRatingCount(oldCount + 1);
            }
        }

        return solutionRepository.save(solution);
    }

    @Transactional(readOnly = true)
    public List<Solution> findByErrorId(Long errorId) {
        return solutionRepository.findByErrorRecordId(errorId);
    }

    private static double clampRating(double rating) {
        return Math.max(MIN_RATING, Math.min(MAX_RATING, rating));
    }
}
