package org.kunlecreates.user.domain.exception;

public class PasswordResetTokenException extends RuntimeException {
    public PasswordResetTokenException(String message) { super(message); }
}