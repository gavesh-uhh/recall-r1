package com.recall.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "debug_session", indexes = {
        @Index(name = "idx_session_project", columnList = "project"),
        @Index(name = "idx_session_error", columnList = "error_record_id")
})
public class DebugSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "error_record_id")
    @JsonIgnore
    private ErrorRecord errorRecord;

    private String project;

    @Lob
    @Column(name = "actions_performed")
    private String actionsPerformed;

    @Column(name = "session_date", nullable = false)
    private LocalDateTime sessionDate;

    @Column(length = 2000)
    private String feedback;

    @PrePersist
    void prePersist() {
        if (sessionDate == null) {
            sessionDate = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ErrorRecord getErrorRecord() { return errorRecord; }
    public void setErrorRecord(ErrorRecord errorRecord) { this.errorRecord = errorRecord; }

    public Long getErrorRecordId() { return errorRecord == null ? null : errorRecord.getId(); }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public String getActionsPerformed() { return actionsPerformed; }
    public void setActionsPerformed(String actionsPerformed) { this.actionsPerformed = actionsPerformed; }

    public LocalDateTime getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDateTime sessionDate) { this.sessionDate = sessionDate; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}
