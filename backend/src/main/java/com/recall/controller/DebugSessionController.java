package com.recall.controller;

import com.recall.dto.DebugSessionRequest;
import com.recall.entity.DebugSession;
import com.recall.service.DebugSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class DebugSessionController {

    private final DebugSessionService debugSessionService;

    public DebugSessionController(DebugSessionService debugSessionService) {
        this.debugSessionService = debugSessionService;
    }

    @PostMapping
    public ResponseEntity<DebugSession> create(@RequestBody DebugSessionRequest request) {
        DebugSession created = debugSessionService.create(request);
        return ResponseEntity
                .created(URI.create("/api/sessions/" + created.getId()))
                .body(created);
    }

    /** Both filters are optional; omitting them returns every session. */
    @GetMapping
    public List<DebugSession> search(@RequestParam(required = false) String project,
                                     @RequestParam(required = false) Long errorId) {
        return debugSessionService.search(project, errorId);
    }
}
