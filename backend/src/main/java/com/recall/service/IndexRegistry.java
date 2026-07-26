package com.recall.service;

import com.recall.datastructure.AVLTree;
import com.recall.datastructure.Graph;
import org.springframework.stereotype.Component;

import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Supplier;

/**
 * Single owner of the two long-lived in-memory indexes:
 * <ul>
 *   <li>{@code signatureIndex} — AVL tree keyed by normalised signature, valued by ErrorRecord id.</li>
 *   <li>{@code errorGraph} — undirected graph of ErrorRecord ids, mirroring the {@code error_relation} table.</li>
 * </ul>
 *
 * <p>Neither structure is thread-safe on its own, and both are mutated from concurrent HTTP
 * request threads, so every access must go through {@link #read(Supplier)} or {@link #write(Runnable)}.
 * Callers must not leak the structures outside those callbacks (the getters exist for the
 * bootstrap/rebuild path and for use <em>inside</em> a lock callback).
 *
 * <p>The {@code stale} flag records that H2 and the in-memory view may have diverged — it is set
 * whenever a database write succeeded but the matching in-memory mutation blew up. Reads may then
 * fall back to the repository, and an operator (or the bootstrap service) can rebuild.
 */
@Component
public class IndexRegistry {

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private final AVLTree<String, Long> signatureIndex = new AVLTree<>();
    private final Graph<Long> errorGraph = new Graph<>();

    private volatile boolean stale;

    /**
     * Direct handle on the AVL index. Only touch this from inside {@link #read(Supplier)} /
     * {@link #write(Runnable)} (or from the bootstrap path, which holds the write lock itself).
     */
    public AVLTree<String, Long> getSignatureIndex() {
        return signatureIndex;
    }

    /** Direct handle on the error graph. Same locking contract as {@link #getSignatureIndex()}. */
    public Graph<Long> getErrorGraph() {
        return errorGraph;
    }

    /** Runs {@code fn} under the shared read lock and returns its result. */
    public <R> R read(Supplier<R> fn) {
        lock.readLock().lock();
        try {
            return fn.get();
        } finally {
            lock.readLock().unlock();
        }
    }

    /** Runs {@code fn} under the exclusive write lock. */
    public void write(Runnable fn) {
        lock.writeLock().lock();
        try {
            fn.run();
        } finally {
            lock.writeLock().unlock();
        }
    }

    /** Write-locked variant that returns a value (e.g. "did this delete actually remove anything?"). */
    public <R> R writeAndGet(Supplier<R> fn) {
        lock.writeLock().lock();
        try {
            return fn.get();
        } finally {
            lock.writeLock().unlock();
        }
    }

    /** The lock itself, for callers that need to span several operations atomically. */
    public ReentrantReadWriteLock getLock() {
        return lock;
    }

    /** Signals that the in-memory view may no longer agree with H2. */
    public void markStale() {
        this.stale = true;
    }

    public boolean isStale() {
        return stale;
    }

    /** Called after a successful full rebuild. */
    public void clearStale() {
        this.stale = false;
    }
}
