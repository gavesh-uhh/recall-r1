package com.recall.dto;

/** Body of {@code POST /api/errors/{id}/relations}. Type defaults to MANUAL when omitted. */
public record RelationRequest(Long relatedErrorId, String type) {
}
