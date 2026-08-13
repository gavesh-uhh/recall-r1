package com.recall.service;

import com.recall.dto.RelationRequest;
import com.recall.entity.ErrorRecord;
import com.recall.entity.ErrorRelation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class GraphIntegrationTest {

    @Autowired
    private ErrorRecordService errorRecordService;

    @Autowired
    private GraphService graphService;

    @Autowired
    private FuzzyMatchService fuzzyMatchService;

    @Autowired
    private com.recall.repository.ErrorRecordRepository repository;

    @Autowired
    private com.recall.repository.ErrorRelationRepository relationRepository;
    
    @Autowired
    private IndexRegistry indexRegistry;

    @BeforeEach
    void setUp() {
        relationRepository.deleteAll();
        repository.deleteAll();
        fuzzyMatchService.clear();
        indexRegistry.write(() -> {
            indexRegistry.getErrorGraph().clear();
            indexRegistry.getSignatureIndex().clear();
        });
    }

    @Test
    void testCompleteChain_SignatureMatch() {
        // 1. Log NullPointerException in UserAuthService
        String signature = "java.lang.NullPointerException: Cannot invoke 'String.length()' because 'str' is null";
        ErrorRecord e1 = new ErrorRecord();
        e1.setSignature(signature);
        e1.setProject("UserAuthService");
        e1.setLanguage("java");
        e1.setTags(List.of("auth"));
        e1 = errorRecordService.create(e1);

        // At this point, no similar signature, signature is inserted into BST
        assertThat(fuzzyMatchService.getTree().findNeighbors(signature)).isNotEmpty();
        List<ErrorRelation> edges = graphService.findAllRelations();
        assertThat(edges).isEmpty();

        // 2. Log NullPointerException in OrderService
        ErrorRecord e2 = new ErrorRecord();
        e2.setSignature(signature);
        e2.setProject("OrderService");
        e2.setLanguage("java");
        e2.setTags(List.of("order"));
        e2 = errorRecordService.create(e2);

        // 3. Signature BST detects similarity, fuzzy match passes, SIGNATURE_MATCH generated
        edges = graphService.findAllRelations();
        assertThat(edges).hasSize(1);
        assertThat(edges.get(0).getRelationType()).isEqualTo(ErrorRelation.SIGNATURE_MATCH);

        // 4. Graph edge created -> related errors endpoint returns linked error
        List<ErrorRecord> relatedToE1 = graphService.findRelated(e1.getId(), null);
        assertThat(relatedToE1).hasSize(1);
        assertThat(relatedToE1.get(0).getId()).isEqualTo(e2.getId());
    }

    @Test
    void testCompleteChain_ManualLink() {
        ErrorRecord e1 = new ErrorRecord();
        e1.setSignature("SigA");
        e1.setProject("P1");
        e1.setLanguage("java");
        e1 = errorRecordService.create(e1);

        ErrorRecord e2 = new ErrorRecord();
        e2.setSignature("SigB");
        e2.setProject("P2");
        e2.setLanguage("java");
        e2 = errorRecordService.create(e2);

        // No automatic link because signatures differ entirely
        List<ErrorRelation> edges = graphService.findAllRelations();
        assertThat(edges).isEmpty();

        // Manual link
        graphService.addManualRelation(e1.getId(), new RelationRequest(e2.getId(), ErrorRelation.MANUAL));

        edges = graphService.findAllRelations();
        assertThat(edges).hasSize(1);
        assertThat(edges.get(0).getRelationType()).isEqualTo(ErrorRelation.MANUAL);

        List<ErrorRecord> relatedToE1 = graphService.findRelated(e1.getId(), null);
        assertThat(relatedToE1).hasSize(1);
        assertThat(relatedToE1.get(0).getId()).isEqualTo(e2.getId());
    }
}
