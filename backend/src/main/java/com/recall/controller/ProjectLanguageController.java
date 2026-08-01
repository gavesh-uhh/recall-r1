package com.recall.controller;

import com.recall.entity.Language;
import com.recall.entity.Project;
import com.recall.repository.ErrorRecordRepository;
import com.recall.repository.LanguageRepository;
import com.recall.repository.ProjectRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ProjectLanguageController {

    private final ProjectRepository projectRepository;
    private final LanguageRepository languageRepository;
    private final ErrorRecordRepository errorRecordRepository;

    public ProjectLanguageController(ProjectRepository projectRepository,
                                     LanguageRepository languageRepository,
                                     ErrorRecordRepository errorRecordRepository) {
        this.projectRepository = projectRepository;
        this.languageRepository = languageRepository;
        this.errorRecordRepository = errorRecordRepository;
    }

    @GetMapping("/projects")
    public List<String> getProjects() {
        Set<String> set = new LinkedHashSet<>();
        // 1. Custom Project entities in DB
        projectRepository.findAll().forEach(p -> set.add(p.getName()));
        // 2. Projects from ErrorRecord entities in DB
        errorRecordRepository.findAll().forEach(e -> {
            if (e.getProject() != null && !e.getProject().isBlank()) {
                set.add(e.getProject());
            }
        });
        return new ArrayList<>(set);
    }

    @PostMapping("/projects")
    public ResponseEntity<Project> createProject(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String trimmed = name.trim();
        Optional<Project> existing = projectRepository.findByNameIgnoreCase(trimmed);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }
        Project saved = projectRepository.save(new Project(trimmed));
        return ResponseEntity.created(URI.create("/api/projects/" + saved.getId())).body(saved);
    }

    @GetMapping("/languages")
    public List<String> getLanguages() {
        Set<String> set = new LinkedHashSet<>();
        // 1. Custom Language entities in DB
        languageRepository.findAll().forEach(l -> set.add(l.getName()));
        // 2. Languages from ErrorRecord entities in DB
        errorRecordRepository.findAll().forEach(e -> {
            if (e.getLanguage() != null && !e.getLanguage().isBlank()) {
                set.add(e.getLanguage());
            }
        });
        return new ArrayList<>(set);
    }

    @PostMapping("/languages")
    public ResponseEntity<Language> createLanguage(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String trimmed = name.trim();
        Optional<Language> existing = languageRepository.findByNameIgnoreCase(trimmed);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }
        Language saved = languageRepository.save(new Language(trimmed));
        return ResponseEntity.created(URI.create("/api/languages/" + saved.getId())).body(saved);
    }
}
