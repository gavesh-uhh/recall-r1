package com.recall.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "solution", indexes = {
        @Index(name = "idx_solution_error", columnList = "error_record_id")
})
public class Solution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "error_record_id", nullable = false)
    @JsonIgnore
    private ErrorRecord errorRecord;

    @Lob
    private String description;

    @Column(name = "success_count", nullable = false)
    private int successCount;

    @Column(name = "failure_count", nullable = false)
    private int failureCount;

    @Column(name = "last_success_date")
    private LocalDateTime lastSuccessDate;

    /** Running average of user ratings, 0..5. */
    @Column(name = "feedback_score", nullable = false)
    private double feedbackScore;

    /** Number of ratings folded into {@link #feedbackScore}, so the average can be updated online. */
    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ErrorRecord getErrorRecord() { return errorRecord; }
    public void setErrorRecord(ErrorRecord errorRecord) { this.errorRecord = errorRecord; }

    /** Exposed so clients can correlate a solution back to its error without leaking the whole graph. */
    public Long getErrorRecordId() { return errorRecord == null ? null : errorRecord.getId(); }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }

    public LocalDateTime getLastSuccessDate() { return lastSuccessDate; }
    public void setLastSuccessDate(LocalDateTime lastSuccessDate) { this.lastSuccessDate = lastSuccessDate; }

    public double getFeedbackScore() { return feedbackScore; }
    public void setFeedbackScore(double feedbackScore) { this.feedbackScore = feedbackScore; }

    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }

    /** Total times this solution was tried, used as the heap's usage-frequency term. */
    @JsonIgnore
    public int getUsageCount() { return successCount + failureCount; }
}
