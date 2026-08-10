package com.recall.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record RelationRequest(
        @JsonAlias({"sourceId", "fromId", "errorId"}) Long sourceErrorId,
        @JsonAlias({"targetErrorId", "toId"}) Long relatedErrorId,
        String type
) {
    public RelationRequest(Long relatedErrorId, String type) {
        this(null, relatedErrorId, type);
    }
}


