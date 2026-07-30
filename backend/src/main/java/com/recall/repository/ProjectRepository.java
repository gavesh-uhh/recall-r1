package com.recall.repository;

import com.recall.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
