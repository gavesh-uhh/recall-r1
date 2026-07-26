package com.recall.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * Single place where exceptions become HTTP responses, so every controller can stay
 * happy-path only. All four handlers emit the same {@link ApiError} shape.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Uniform error envelope. {@code status} is the numeric code, {@code error} its reason phrase. */
    public record ApiError(LocalDateTime timestamp, int status, String error, String message) {

        static ApiError of(HttpStatus status, String message) {
            return new ApiError(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message);
        }
    }

    /** Services throw this for a missing entity; it is the canonical 404 signal. */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNotFound(NoSuchElementException e) {
        String message = e.getMessage() == null ? "Resource not found" : e.getMessage();
        log.debug("404 Not Found: {}", message);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(HttpStatus.NOT_FOUND, message));
    }

    /** Services throw this for input they can see is wrong (bad ids, out-of-range ratings, ...). */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException e) {
        String message = e.getMessage() == null ? "Invalid request" : e.getMessage();
        log.debug("400 Bad Request: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(HttpStatus.BAD_REQUEST, message));
    }

    /** Bean-validation failures, flattened to {@code field: message} pairs in one string. */
    /**
     * Unparseable or type-mismatched request input is the client's error, not ours. Without this
     * the catch-all below would report malformed JSON as a 500. The parser's raw message can echo
     * request content and internal type names, so it is deliberately not forwarded.
     */
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ApiError> handleUnreadable(Exception e) {
        log.debug("Rejected malformed request: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiError.of(HttpStatus.BAD_REQUEST, "Malformed or invalid request"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + describe(fe))
                .collect(Collectors.joining("; "));
        if (message.isEmpty()) {
            message = "Validation failed";
        }
        log.debug("400 Bad Request (validation): {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(HttpStatus.BAD_REQUEST, message));
    }

    private static String describe(FieldError fe) {
        return fe.getDefaultMessage() == null ? "is invalid" : fe.getDefaultMessage();
    }

    /**
     * Catch-all. The stack trace goes to the log; the client gets a fixed string so we never
     * leak an exception class name, SQL fragment, or internal path.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception e) {
        log.error("Unhandled exception while serving request", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(HttpStatus.INTERNAL_SERVER_ERROR,
                        "An unexpected internal error occurred"));
    }
}
