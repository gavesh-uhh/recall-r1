package com.recall.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "error_record", indexes = {
        @Index(name = "idx_error_signature", columnList = "signature"),
        @Index(name = "idx_error_project", columnList = "project"),
        @Index(name = "idx_error_language", columnList = "language")
})
public class ErrorRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String signature;

    @Column(length = 2000)
    private String message;

    @Lob
    @Column(name = "stack_trace")
    private String stackTrace;

    private String language;
    private String framework;
    private String project;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "error_record_tags", joinColumns = @JoinColumn(name = "error_record_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "errorRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Solution> solutions = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getFramework() { return framework; }
    public void setFramework(String framework) { this.framework = framework; }

    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags == null ? new ArrayList<>() : tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public List<Solution> getSolutions() { return solutions; }
    public void setSolutions(List<Solution> solutions) { this.solutions = solutions; }
}
