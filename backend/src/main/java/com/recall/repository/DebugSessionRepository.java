package com.recall.repository;

import com.recall.entity.DebugSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DebugSessionRepository extends JpaRepository<DebugSession, Long> {

    /** Both filters optional; a null argument means "don't filter on this column". */
    @Query("""
            SELECT s FROM DebugSession s
            WHERE (:project IS NULL OR s.project = :project)
              AND (:errorId IS NULL OR s.errorRecord.id = :errorId)
            ORDER BY s.sessionDate DESC
            """)
    List<DebugSession> search(@Param("project") String project, @Param("errorId") Long errorId);

    /**
     * Explicit JPQL rather than a derived {@code deleteByErrorRecordId}: the derived form is not
     * resolvable because Hibernate will not traverse {@code errorRecord.id} for a delete query.
     */
    @Modifying
    @Query("DELETE FROM DebugSession s WHERE s.errorRecord.id = :errorRecordId")
    void deleteByErrorRecordId(@Param("errorRecordId") Long errorRecordId);
}
