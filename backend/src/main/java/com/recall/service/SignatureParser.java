package com.recall.service;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SignatureParser {

    private static final Pattern JAVA_EXCEPTION_PATTERN = Pattern.compile("^([a-zA-Z0-9_.]+(?:Exception|Error)):?(.*?)(?:\\s+at\\s+([a-zA-Z0-9_.$]+)\\.([a-zA-Z0-9_]+))?$", Pattern.CASE_INSENSITIVE);

    public static ParsedSignature parse(String message) {
        if (message == null) return new ParsedSignature("UNKNOWN", "UNKNOWN", "UNKNOWN", "");
        
        String[] lines = message.split("\\r?\\n");
        String firstLine = lines[0].trim();
        
        Matcher matcher = JAVA_EXCEPTION_PATTERN.matcher(firstLine);
        if (matcher.find()) {
            String type = matcher.group(1) != null ? matcher.group(1).trim() : "UNKNOWN";
            String msg = matcher.group(2) != null ? clean(matcher.group(2).trim()) : "";
            String clazz = matcher.group(3) != null ? matcher.group(3).trim() : "UNKNOWN";
            String method = matcher.group(4) != null ? matcher.group(4).trim() : "UNKNOWN";
            return new ParsedSignature(type, clazz, method, msg);
        }
        
        // Fallback
        return new ParsedSignature("UNKNOWN", "UNKNOWN", "UNKNOWN", clean(firstLine));
    }

    private static String clean(String message) {
        if (message == null) return "";
        String out = message.toLowerCase(Locale.ROOT);
        out = out.replaceAll("\"[^\"]*\"", " ");
        out = out.replaceAll("'[^']*'", " ");
        out = out.replaceAll("0x[0-9a-f]+", " ");
        out = out.replaceAll("@[0-9a-f]+", " ");
        out = out.replaceAll("[0-9]+", " ");
        out = out.replaceAll("\\s+", " ");
        return out.trim();
    }
}
