package com.recall.service;

import java.util.Objects;

public class ParsedSignature {
    private final String errorType;
    private final String sourceClass;
    private final String method;
    private final String normalizedMessage;

    public ParsedSignature(String errorType, String sourceClass, String method, String normalizedMessage) {
        this.errorType = errorType;
        this.sourceClass = sourceClass;
        this.method = method;
        this.normalizedMessage = normalizedMessage;
    }

    public String getErrorType() { return errorType; }
    public String getSourceClass() { return sourceClass; }
    public String getMethod() { return method; }
    public String getNormalizedMessage() { return normalizedMessage; }

    public String toSearchableString() {
        return errorType + ":" + sourceClass + ":" + method + ":" + normalizedMessage;
    }

    public static ParsedSignature fromSearchableString(String str) {
        if (str == null) return new ParsedSignature("UNKNOWN", "UNKNOWN", "UNKNOWN", "");
        String[] parts = str.split(":", 4);
        String type = parts.length > 0 ? parts[0] : "UNKNOWN";
        String clazz = parts.length > 1 ? parts[1] : "UNKNOWN";
        String meth = parts.length > 2 ? parts[2] : "UNKNOWN";
        String msg = parts.length > 3 ? parts[3] : "";
        return new ParsedSignature(type, clazz, meth, msg);
    }
}
