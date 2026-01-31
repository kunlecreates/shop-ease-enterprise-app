package org.kunlecreates.user.domain.exception;

public class PasswordResetRequiredException extends RuntimeException {
    public PasswordResetRequiredException(String message) { super(message); }
}
