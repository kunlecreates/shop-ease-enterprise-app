package org.kunlecreates.order.interfaces.dto;

import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

public record CartResponse(
    Long id,
    String userRef,
    String status,
    List<CartItemResponse> items,
    Long totalCents,
    Instant createdAt,
    Instant updatedAt
) {
    public static CartResponse from(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
            .map(CartItemResponse::from)
            .collect(Collectors.toList());
        
        Long total = cart.getItems().stream()
            .mapToLong(item -> item.getQuantity() * item.getUnitPriceCents())
            .sum();
        
        return new CartResponse(
            cart.getId(),
            cart.getUserRef(),
            cart.getStatus(),
            itemResponses,
            total,
            cart.getCreatedAt(),
            cart.getUpdatedAt()
        );
    }
    
    public record CartItemResponse(
        Long id,
        String productRef,
        Integer quantity,
        Long unitPriceCents,
        Long subtotalCents,
        String currency
    ) {
        public static CartItemResponse from(CartItem item) {
            return new CartItemResponse(
                item.getId(),
                item.getProductRef(),
                item.getQuantity(),
                item.getUnitPriceCents(),
                item.getQuantity() * item.getUnitPriceCents(),
                item.getCurrency()
            );
        }
    }
}
