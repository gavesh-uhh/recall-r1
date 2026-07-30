package com.recall.repository;

import com.recall.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LanguageRepository extends JpaRepository<Language, Long> {
    Optional<Language> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
