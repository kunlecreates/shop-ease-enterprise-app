package org.kunlecreates.order.interfaces.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PaymentMethod(
    @NotBlank(message = "Payment method type is required")
    @Pattern(regexp = "^(CREDIT_CARD|DEBIT_CARD|PAYPAL|APPLE_PAY|GOOGLE_PAY)$", 
             message = "Invalid payment method type")
    String type,
    
    @Pattern(regexp = "^\\d{4}$", message = "Last 4 digits must be exactly 4 numeric characters")
    String last4,
    
    @Size(max = 50, message = "Payment brand must not exceed 50 characters")
    String brand
) {}
