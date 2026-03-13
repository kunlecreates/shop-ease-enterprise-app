package org.kunlecreates.order.interfaces.dto;

import java.time.Instant;

public record OrderResponse(
    Long id,
    String userRef,
    String customerName,
    String status,
    Long totalCents,
    String currency,
    Instant placedAt,
    Instant createdAt,
    Instant updatedAt,
    ShippingAddress shippingAddress,
    PaymentMethod paymentMethod
) {
    public double getTotal() {
        return totalCents != null ? totalCents / 100.0 : 0.0;
    }
    
    public double total() {
        return getTotal();
    }
}
