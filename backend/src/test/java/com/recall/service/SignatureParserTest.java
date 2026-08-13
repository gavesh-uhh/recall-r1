package com.recall.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SignatureParserTest {

    @Test
    void testParseStandardException() {
        String msg = "java.lang.NullPointerException: Cannot invoke getPasswordHash() at com.auth.UserAuthService.authenticate";
        ParsedSignature sig = SignatureParser.parse(msg);
        assertEquals("java.lang.NullPointerException", sig.getErrorType());
        assertEquals("com.auth.UserAuthService", sig.getSourceClass());
        assertEquals("authenticate", sig.getMethod());
        assertEquals("cannot invoke getpasswordhash()", sig.getNormalizedMessage());
    }

    @Test
    void testParseWithoutMethod() {
        String msg = "IllegalArgumentException: invalid user";
        ParsedSignature sig = SignatureParser.parse(msg);
        assertEquals("IllegalArgumentException", sig.getErrorType());
        assertEquals("UNKNOWN", sig.getSourceClass());
        assertEquals("UNKNOWN", sig.getMethod());
        assertEquals("invalid user", sig.getNormalizedMessage());
    }

    @Test
    void testParseHikariPool() {
        String msg = "ConnectionTimeoutException: HikariPool-1 - Connection is not available, request timed out at com.recall.PaymentService.connect";
        ParsedSignature sig = SignatureParser.parse(msg);
        assertEquals("ConnectionTimeoutException", sig.getErrorType());
        assertEquals("com.recall.PaymentService", sig.getSourceClass());
        assertEquals("connect", sig.getMethod());
        assertEquals("hikaripool- - connection is not available, request timed out", sig.getNormalizedMessage());
    }
}
