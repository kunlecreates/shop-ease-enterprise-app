package org.kunlecreates.order.domain;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public enum OrderStatus {
    PENDING("PENDING"),
    PAID("PAID"),
    SHIPPED("SHIPPED"),
    DELIVERED("DELIVERED"),
    CANCELLED("CANCELLED"),
    REFUNDED("REFUNDED");

    private final String value;

    OrderStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    private static final Map<OrderStatus, List<OrderStatus>> VALID_TRANSITIONS = Map.of(
        PENDING, Arrays.asList(PAID, CANCELLED),
        PAID, Arrays.asList(SHIPPED, REFUNDED, CANCELLED),
        SHIPPED, Arrays.asList(DELIVERED),
        DELIVERED, Arrays.asList(),
        CANCELLED, Arrays.asList(),
        REFUNDED, Arrays.asList()
    );

    public boolean canTransitionTo(OrderStatus newStatus) {
        return VALID_TRANSITIONS.get(this).contains(newStatus);
    }

    public static OrderStatus fromString(String status) {
        for (OrderStatus s : OrderStatus.values()) {
            if (s.value.equalsIgnoreCase(status)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Invalid order status: " + status);
    }
}
