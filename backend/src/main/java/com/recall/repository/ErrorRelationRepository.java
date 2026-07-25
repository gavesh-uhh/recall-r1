package com.recall.repository;

import com.recall.entity.ErrorRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ErrorRelationRepository extends JpaRepository<ErrorRelation, Long> {

    /** Duplicate guard for undirected edges — checks both orientations. */
    @Query("""
            SELECT r FROM ErrorRelation r
            WHERE (r.errorAId = :a AND r.errorBId = :b)
               OR (r.errorAId = :b AND r.errorBId = :a)
            """)
    List<ErrorRelation> findEdge(@Param("a") Long a, @Param("b") Long b);

    @Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM ErrorRelation r WHERE r.errorAId = :id OR r.errorBId = :id")
    void deleteAllTouching(@Param("id") Long id);
}
