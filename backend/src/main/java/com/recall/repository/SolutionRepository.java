package com.recall.repository;

import com.recall.entity.Solution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SolutionRepository extends JpaRepository<Solution, Long> {

    /**
     * Explicit JPQL, not a derived query. {@link Solution} exposes a convenience
     * {@code getErrorRecordId()} accessor for JSON, which makes Spring Data resolve
     * {@code ErrorRecordId} as a single bean property rather than traversing
     * {@code errorRecord.id} — the derived form fails against the JPA metamodel.
     */
    @Query("SELECT s FROM Solution s WHERE s.errorRecord.id = :errorRecordId")
    List<Solution> findByErrorRecordId(@Param("errorRecordId") Long errorRecordId);

    /** Explicit JPQL for the same reason as {@link #findByErrorRecordId(Long)}. */
    @Modifying
    @Query("DELETE FROM Solution s WHERE s.errorRecord.id = :errorRecordId")
    void deleteByErrorRecordId(@Param("errorRecordId") Long errorRecordId);
}
