package com.recall.datastructure;

import com.recall.entity.Solution;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Array-backed binary max-heap. Deliberately not {@code java.util.PriorityQueue} —
 * the sift-up / sift-down and the O(n) bottom-up heapify are the point of the exercise.
 *
 * <p>The heap is stored in an {@link ArrayList} using the standard implicit-tree layout:
 * for index {@code i} the parent is {@code (i-1)/2} and the children are {@code 2i+1}
 * and {@code 2i+2}.
 *
 * <p><strong>Not thread-safe.</strong> The service layer rebuilds the heap per query, so
 * each instance is confined to a single thread.
 *
 * @param <T> element type, ordered by the supplied comparator (max = comparator-greatest)
 */
public class MaxHeap<T> {

    private final List<T> heap = new ArrayList<>();
    private final Comparator<T> comparator;

    public MaxHeap(Comparator<T> comparator) {
        if (comparator == null) {
            throw new NullPointerException("MaxHeap requires a comparator");
        }
        this.comparator = comparator;
    }

    /** Appends then sifts up — O(log n). */
    public void insert(T item) {
        heap.add(item);
        siftUp(heap.size() - 1);
    }

    /**
     * Removes and returns the comparator-greatest element.
     *
     * @return the max, or {@code null} when the heap is empty
     */
    public T extractMax() {
        if (heap.isEmpty()) {
            return null;
        }
        T max = heap.get(0);
        T last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            siftDown(0);
        }
        return max;
    }

    /** @return the max without removing it, or {@code null} when empty. */
    public T peek() {
        return heap.isEmpty() ? null : heap.get(0);
    }

    /**
     * Discards the current contents and builds a heap from {@code items} bottom-up in O(n)
     * (rather than n inserts at O(n log n)). A null or empty list simply empties the heap.
     */
    public void heapify(List<T> items) {
        heap.clear();
        if (items == null || items.isEmpty()) {
            return;
        }
        heap.addAll(items);
        for (int i = (heap.size() / 2) - 1; i >= 0; i--) {
            siftDown(i);
        }
    }

    public int size() {
        return heap.size();
    }

    public boolean isEmpty() {
        return heap.isEmpty();
    }

    /**
     * Drains the whole heap into a list in descending comparator order.
     * The heap is left empty — callers wanting to keep the contents should re-heapify.
     */
    public List<T> drainSorted() {
        List<T> sorted = new ArrayList<>(heap.size());
        T next;
        while ((next = extractMax()) != null) {
            sorted.add(next);
        }
        // A heap of nulls would terminate early; the ranking use-case never stores nulls.
        heap.clear();
        return sorted;
    }

    // ------------------------------------------------------------------ internals

    private void siftUp(int index) {
        int i = index;
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (comparator.compare(heap.get(i), heap.get(parent)) <= 0) {
                break;
            }
            swap(i, parent);
            i = parent;
        }
    }

    private void siftDown(int index) {
        int i = index;
        int n = heap.size();
        while (true) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            int largest = i;
            if (left < n && comparator.compare(heap.get(left), heap.get(largest)) > 0) {
                largest = left;
            }
            if (right < n && comparator.compare(heap.get(right), heap.get(largest)) > 0) {
                largest = right;
            }
            if (largest == i) {
                return;
            }
            swap(i, largest);
            i = largest;
        }
    }

    private void swap(int a, int b) {
        T tmp = heap.get(a);
        heap.set(a, heap.get(b));
        heap.set(b, tmp);
    }

    // ------------------------------------------------------- solution ranking

    /**
     * The single source of truth for a solution's rank score, so the heap ordering and the
     * {@code decayScore} field exposed by the API can never diverge.
     *
     * <p>Score is
     * {@code (successRate*w1 + usageFrequency*w2 + normalisedFeedback*w3) * exp(-lambda*days)}.
     * Days elapsed is fractional (minutes / 1440) so two successes on the same day still
     * order sensibly. A {@code null} lastSuccessDate means "never succeeded", which is
     * treated as maximally decayed: the decay factor is 0.0, driving the score to 0.
     */
    public static double scoreOf(Solution s,
                                 double lambda,
                                 double w1, double w2, double w3,
                                 double frequencySaturation,
                                 LocalDateTime now) {
        if (s == null) {
            return 0.0;
        }
        double successRate = DecayFunction.successRate(s.getSuccessCount(), s.getFailureCount());
        double usage = DecayFunction.usageFrequency(s.getUsageCount(), frequencySaturation);
        double feedback = DecayFunction.normaliseFeedback(s.getFeedbackScore());

        double decay;
        if (s.getLastSuccessDate() == null) {
            decay = 0.0; // never succeeded → infinitely stale
        } else {
            double days = Duration.between(s.getLastSuccessDate(), now).toMinutes() / 1440.0;
            decay = DecayFunction.decayFactor(lambda, days);
        }
        return DecayFunction.weightedScore(successRate, usage, feedback, w1, w2, w3, decay);
    }

    /**
     * Comparator ranking solutions by {@link #scoreOf} descending (highest score = heap max).
     * Ties break on id so the ordering is deterministic across rebuilds.
     */
    public static Comparator<Solution> solutionComparator(double lambda,
                                                          double w1, double w2, double w3,
                                                          double frequencySaturation,
                                                          LocalDateTime now) {
        return (a, b) -> {
            double sa = scoreOf(a, lambda, w1, w2, w3, frequencySaturation, now);
            double sb = scoreOf(b, lambda, w1, w2, w3, frequencySaturation, now);
            int byScore = Double.compare(sa, sb);
            if (byScore != 0) {
                return byScore;
            }
            Long ia = a == null ? null : a.getId();
            Long ib = b == null ? null : b.getId();
            if (ia == null || ib == null) {
                return 0;
            }
            // Lower id wins ties: invert so the smaller id compares "greater" in the max-heap.
            return Long.compare(ib, ia);
        };
    }
}
