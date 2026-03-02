package org.kunlecreates.order.interfaces.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
    /**
     * Optional cross-service user reference (UUID string). If provided, this will be
     * preferred over numeric `userId` for linking orders to users.
     */
    String userRef,

    /**
     * Backwards-compatible numeric user id. May be null during transition to UUID refs.
     */
    Long userId,

    @NotNull
    String status,

    @Min(0)
    double total,

    // List of items: productRef uses String to support UUIDs
    List<CreateOrderItem> items,
    
    @Valid
    ShippingAddress shippingAddress,
    
    @Valid
    PaymentMethod paymentMethod
) {
    public record CreateOrderItem(
        @NotNull
        String productRef,
        String productName,
        @Min(1)
        int quantity,
        @Min(0)
        double unitPrice
    ) {}
}
