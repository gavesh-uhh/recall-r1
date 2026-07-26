package com.recall.datastructure;

import com.recall.entity.Solution;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Plain unit tests — no Spring context. */
class MaxHeapTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2025, 1, 1, 12, 0);

    private static Solution solution(long id, int successes, int failures,
                                     double feedback, LocalDateTime lastSuccess) {
        Solution s = new Solution();
        s.setId(id);
        s.setSuccessCount(successes);
        s.setFailureCount(failures);
        s.setFeedbackScore(feedback);
        s.setLastSuccessDate(lastSuccess);
        return s;
    }

    @Test
    @DisplayName("extractMax yields strictly descending order")
    void extractMaxIsDescending() {
        MaxHeap<Integer> heap = new MaxHeap<Integer>(Comparator.naturalOrder());
        for (int v : new int[]{5, 1, 9, 3, 7, 2, 8, 6, 4}) {
            heap.insert(v);
        }
        assertEquals(9, heap.size());

        Integer previous = heap.extractMax();
        assertEquals(9, previous);
        int count = 1;
        Integer next;
        while ((next = heap.extractMax()) != null) {
            assertTrue(next < previous, next + " should be strictly less than " + previous);
            previous = next;
            count++;
        }
        assertEquals(9, count);
        assertTrue(heap.isEmpty());
    }

    @Test
    @DisplayName("drainSorted returns everything in descending order and empties the heap")
    void drainSorted() {
        MaxHeap<Integer> heap = new MaxHeap<Integer>(Comparator.naturalOrder());
        for (int v : new int[]{4, 10, 2, 8, 6}) {
            heap.insert(v);
        }
        assertEquals(List.of(10, 8, 6, 4, 2), heap.drainSorted());
        assertEquals(0, heap.size());
        assertTrue(heap.isEmpty());
        assertTrue(heap.drainSorted().isEmpty());
    }

    @Test
    @DisplayName("heapify replaces the previous contents and yields the correct max")
    void heapifyReplacesContents() {
        MaxHeap<Integer> heap = new MaxHeap<Integer>(Comparator.naturalOrder());
        heap.insert(1000);
        heap.insert(999);
        assertEquals(1000, heap.peek());

        heap.heapify(List.of(3, 17, 5, 12, 1));
        assertEquals(5, heap.size(), "old contents must be discarded, not merged");
        assertEquals(17, heap.peek());
        assertEquals(List.of(17, 12, 5, 3, 1), heap.drainSorted());

        heap.heapify(List.of());
        assertTrue(heap.isEmpty());
        heap.heapify(null);
        assertTrue(heap.isEmpty());
    }

    @Test
    @DisplayName("heapify on a fully reversed list still produces a valid heap")
    void heapifyBottomUpOnDescendingInput() {
        MaxHeap<Integer> heap = new MaxHeap<Integer>(Comparator.naturalOrder());
        heap.heapify(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
        assertEquals(10, heap.peek());
        assertEquals(List.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1), heap.drainSorted());
    }

    @Test
    @DisplayName("peek does not mutate the heap")
    void peekDoesNotMutate() {
        MaxHeap<Integer> heap = new MaxHeap<Integer>(Comparator.naturalOrder());
        heap.insert(2);
        heap.insert(11);
        heap.insert(7);

        assertEquals(11, heap.peek());
        assertEquals(11, heap.peek());
        assertEquals(3, heap.size());
        assertEquals(List.of(11, 7, 2), heap.drainSorted());
    }

    @Test
    @DisplayName("empty heap returns null from extractMax and peek")
    void emptyHeapReturnsNull() {
        MaxHeap<String> heap = new MaxHeap<String>(Comparator.naturalOrder());
        assertTrue(heap.isEmpty());
        assertEquals(0, heap.size());
        assertNull(heap.peek());
        assertNull(heap.extractMax());

        heap.insert("only");
        assertFalse(heap.isEmpty());
        assertEquals("only", heap.extractMax());
        assertNull(heap.extractMax());
        assertNull(heap.peek());
    }

    @Test
    @DisplayName("identical counters: the older last-success ranks lower")
    void olderLastSuccessRanksLower() {
        Solution fresh = solution(1L, 5, 1, 4.0, NOW.minusDays(1));
        Solution stale = solution(2L, 5, 1, 4.0, NOW.minusDays(40));

        double lambda = 0.05;
        double freshScore = MaxHeap.scoreOf(fresh, lambda, 0.5, 0.3, 0.2, 10.0, NOW);
        double staleScore = MaxHeap.scoreOf(stale, lambda, 0.5, 0.3, 0.2, 10.0, NOW);
        assertTrue(staleScore < freshScore,
                "stale " + staleScore + " should be below fresh " + freshScore);

        MaxHeap<Solution> heap = new MaxHeap<>(
                MaxHeap.solutionComparator(lambda, 0.5, 0.3, 0.2, 10.0, NOW));
        heap.heapify(List.of(stale, fresh));

        assertSame(fresh, heap.peek());
        List<Solution> ranked = heap.drainSorted();
        assertEquals(List.of(1L, 2L), ranked.stream().map(Solution::getId).toList());
    }

    @Test
    @DisplayName("under a large lambda a stale high-success solution loses to a fresh moderate one")
    void staleHighSuccessLosesToFreshModerate() {
        // Perfect record, five-star, saturated usage — but two months old.
        Solution staleStar = solution(1L, 100, 0, 5.0, NOW.minusDays(60));
        // Mediocre record, average rating — but succeeded an hour ago.
        Solution freshModerate = solution(2L, 2, 1, 3.0, NOW.minusHours(1));

        double lambda = 0.5; // aggressive recency preference
        double staleScore = MaxHeap.scoreOf(staleStar, lambda, 0.5, 0.3, 0.2, 10.0, NOW);
        double freshScore = MaxHeap.scoreOf(freshModerate, lambda, 0.5, 0.3, 0.2, 10.0, NOW);
        assertTrue(staleScore < freshScore,
                "stale star " + staleScore + " must lose to fresh moderate " + freshScore);

        MaxHeap<Solution> heap = new MaxHeap<>(
                MaxHeap.solutionComparator(lambda, 0.5, 0.3, 0.2, 10.0, NOW));
        heap.insert(staleStar);
        heap.insert(freshModerate);
        assertSame(freshModerate, heap.extractMax());
        assertSame(staleStar, heap.extractMax());

        // With lambda = 0 (decay disabled) the ordering flips back to raw quality.
        double flatStale = MaxHeap.scoreOf(staleStar, 0.0, 0.5, 0.3, 0.2, 10.0, NOW);
        double flatFresh = MaxHeap.scoreOf(freshModerate, 0.0, 0.5, 0.3, 0.2, 10.0, NOW);
        assertTrue(flatStale > flatFresh, "without decay the star record should win");
    }

    @Test
    @DisplayName("scoreOf matches a hand-computed value and is the comparator's source of truth")
    void scoreOfIsSourceOfTruth() {
        Solution s = solution(1L, 3, 1, 4.0, NOW.minusDays(10));
        // successRate 3/4 = 0.75; usage 4/10 = 0.4; feedback 4/5 = 0.8
        // base = 0.75*0.5 + 0.4*0.3 + 0.8*0.2 = 0.375 + 0.12 + 0.16 = 0.655
        // decay = exp(-0.05*10) = exp(-0.5)
        double expected = 0.655 * Math.exp(-0.5);
        assertEquals(expected, MaxHeap.scoreOf(s, 0.05, 0.5, 0.3, 0.2, 10.0, NOW), 1e-9);

        Solution worse = solution(2L, 1, 3, 1.0, NOW.minusDays(10));
        Comparator<Solution> cmp = MaxHeap.solutionComparator(0.05, 0.5, 0.3, 0.2, 10.0, NOW);
        assertTrue(cmp.compare(s, worse) > 0, "comparator must agree with scoreOf");
        assertTrue(cmp.compare(worse, s) < 0);
    }

    @Test
    @DisplayName("a null lastSuccessDate is treated as maximally decayed (factor 0)")
    void nullLastSuccessIsMaximallyDecayed() {
        Solution never = solution(1L, 10, 0, 5.0, null);
        Solution barelyUsed = solution(2L, 1, 5, 1.0, NOW.minusDays(3));

        assertEquals(0.0, MaxHeap.scoreOf(never, 0.05, 0.5, 0.3, 0.2, 10.0, NOW), 1e-12);
        assertTrue(MaxHeap.scoreOf(barelyUsed, 0.05, 0.5, 0.3, 0.2, 10.0, NOW) > 0.0);

        MaxHeap<Solution> heap = new MaxHeap<>(
                MaxHeap.solutionComparator(0.05, 0.5, 0.3, 0.2, 10.0, NOW));
        heap.heapify(List.of(never, barelyUsed));
        assertSame(barelyUsed, heap.peek());
        assertEquals(0.0, MaxHeap.scoreOf(null, 0.05, 0.5, 0.3, 0.2, 10.0, NOW), 1e-12);
    }

    @Test
    @DisplayName("fractional days: a same-day success outranks one 12 hours earlier")
    void fractionalDaysMatter() {
        Solution recent = solution(1L, 4, 0, 4.0, NOW.minusMinutes(30));
        Solution earlierToday = solution(2L, 4, 0, 4.0, NOW.minusHours(12));

        double lambda = 0.05;
        assertTrue(MaxHeap.scoreOf(earlierToday, lambda, 0.5, 0.3, 0.2, 10.0, NOW)
                < MaxHeap.scoreOf(recent, lambda, 0.5, 0.3, 0.2, 10.0, NOW));
    }

    @Test
    @DisplayName("ranking a realistic batch gives non-increasing scores")
    void batchRankingIsMonotonic() {
        List<Solution> batch = List.of(
                solution(1L, 8, 2, 4.5, NOW.minusDays(2)),
                solution(2L, 1, 9, 1.0, NOW.minusDays(1)),
                solution(3L, 20, 0, 5.0, NOW.minusDays(90)),
                solution(4L, 3, 3, 3.0, NOW.minusHours(6)),
                solution(5L, 0, 0, 0.0, null));

        double lambda = 0.05;
        MaxHeap<Solution> heap = new MaxHeap<>(
                MaxHeap.solutionComparator(lambda, 0.5, 0.3, 0.2, 10.0, NOW));
        heap.heapify(batch);
        List<Solution> ranked = heap.drainSorted();

        assertEquals(batch.size(), ranked.size());
        for (int i = 1; i < ranked.size(); i++) {
            double prev = MaxHeap.scoreOf(ranked.get(i - 1), lambda, 0.5, 0.3, 0.2, 10.0, NOW);
            double cur = MaxHeap.scoreOf(ranked.get(i), lambda, 0.5, 0.3, 0.2, 10.0, NOW);
            assertTrue(prev >= cur, "scores not non-increasing at index " + i);
        }
        assertEquals(1L, ranked.get(0).getId());
        assertEquals(5L, ranked.get(ranked.size() - 1).getId(), "never-succeeded ranks last");
    }
}
