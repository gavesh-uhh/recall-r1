package com.recall.repository;

import com.recall.entity.ErrorRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ErrorRecordRepository extends JpaRepository<ErrorRecord, Long> {

    Optional<ErrorRecord> findFirstBySignature(String signature);

    List<ErrorRecord> findBySignature(String signature);

    /** Browse view filter; a null argument means "don't filter on this column". */
    @Query("""
            SELECT e FROM ErrorRecord e
            WHERE (:project IS NULL OR e.project = :project)
              AND (:language IS NULL OR e.language = :language)
            ORDER BY e.createdAt DESC
            """)
    List<ErrorRecord> search(@Param("project") String project, @Param("language") String language);

    List<ErrorRecord> findByProject(String project);
}
