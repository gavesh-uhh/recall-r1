package com.recall.entity;

import jakarta.persistence.*;

/**
 * Backing table for graph edges so the in-memory {@code Graph} can be rebuilt on restart.
 * Edges are undirected; {@code errorAId} / {@code errorBId} ordering is not significant.
 */
@Entity
@Table(name = "error_relation", indexes = {
        @Index(name = "idx_relation_a", columnList = "error_a_id"),
        @Index(name = "idx_relation_b", columnList = "error_b_id")
})
public class ErrorRelation {

    public static final String SIGNATURE_MATCH = "SIGNATURE_MATCH";
    public static final String TAG_MATCH = "TAG_MATCH";
    public static final String MANUAL = "MANUAL";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "error_a_id", nullable = false)
    private Long errorAId;

    @Column(name = "error_b_id", nullable = false)
    private Long errorBId;

    @Column(name = "relation_type", nullable = false)
    private String relationType;

    public ErrorRelation() {
    }

    public ErrorRelation(Long errorAId, Long errorBId, String relationType) {
        this.errorAId = errorAId;
        this.errorBId = errorBId;
        this.relationType = relationType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getErrorAId() { return errorAId; }
    public void setErrorAId(Long errorAId) { this.errorAId = errorAId; }

    public Long getErrorBId() { return errorBId; }
    public void setErrorBId(Long errorBId) { this.errorBId = errorBId; }

    public String getRelationType() { return relationType; }
    public void setRelationType(String relationType) { this.relationType = relationType; }
}
