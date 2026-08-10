package com.recall.service;

import com.recall.datastructure.AVLTree;
import com.recall.datastructure.Graph;
import org.springframework.stereotype.Component;

import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Supplier;

// Thread-safe container managing in-memory indexes (AVL tree and Error Graph)
@Component
public class IndexRegistry {

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    private final AVLTree<String, Long> signatureIndex = new AVLTree<>();
    private final Graph<Long> errorGraph = new Graph<>();

    private volatile boolean stale;

    // Direct handle to AVL signature index
    public AVLTree<String, Long> getSignatureIndex() {
        return signatureIndex;
    }

    // Direct handle to error relationship graph
    public Graph<Long> getErrorGraph() {
        return errorGraph;
    }

    // Run callback under shared read lock
    public <R> R read(Supplier<R> fn) {
        lock.readLock().lock();
        try {
            return fn.get();
        } finally {
            lock.readLock().unlock();
        }
    }

    // Run callback under exclusive write lock
    public void write(Runnable fn) {
        lock.writeLock().lock();
        try {
            fn.run();
        } finally {
            lock.writeLock().unlock();
        }
    }

    // Run callback under write lock and return result
    public <R> R writeAndGet(Supplier<R> fn) {
        lock.writeLock().lock();
        try {
            return fn.get();
        } finally {
            lock.writeLock().unlock();
        }
    }

    // Get internal lock instance
    public ReentrantReadWriteLock getLock() {
        return lock;
    }

    // Flag that in-memory state diverged from H2 DB
    public void markStale() {
        this.stale = true;
    }

    public boolean isStale() {
        return stale;
    }

    // Clear stale flag after full rebuild
    public void clearStale() {
        this.stale = false;
    }
}
