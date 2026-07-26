package com.recall.service;

import com.recall.dto.DebugSessionRequest;
import com.recall.entity.DebugSession;
import com.recall.entity.ErrorRecord;
import com.recall.repository.DebugSessionRepository;
import com.recall.repository.ErrorRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

/** Debug-journal entries. Sessions may float free of any error record. */
@Service
public class DebugSessionService {

    private final DebugSessionRepository debugSessionRepository;
    private final ErrorRecordRepository errorRecordRepository;

    public DebugSessionService(DebugSessionRepository debugSessionRepository,
                               ErrorRecordRepository errorRecordRepository) {
        this.debugSessionRepository = debugSessionRepository;
        this.errorRecordRepository = errorRecordRepository;
    }

    /**
     * @throws NoSuchElementException when {@code req.errorId()} is supplied but unknown. A null
     *                                errorId is fine — the session is simply unattached.
     */
    @Transactional
    public DebugSession create(DebugSessionRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("request body is required");
        }

        DebugSession session = new DebugSession();
        if (req.errorId() != null) {
            ErrorRecord error = errorRecordRepository.findById(req.errorId())
                    .orElseThrow(() -> new NoSuchElementException("ErrorRecord not found: " + req.errorId()));
            session.setErrorRecord(error);
        }
        session.setProject(req.project());
        session.setActionsPerformed(req.actionsPerformed());
        session.setSessionDate(req.sessionDate() == null ? LocalDateTime.now() : req.sessionDate());
        session.setFeedback(req.feedback());

        return debugSessionRepository.save(session);
    }

    /** Blank filters are passed as null so the query ignores that column. */
    @Transactional(readOnly = true)
    public List<DebugSession> search(String project, Long errorId) {
        String normalizedProject = (project == null || project.isBlank()) ? null : project.trim();
        return debugSessionRepository.search(normalizedProject, errorId);
    }
}
