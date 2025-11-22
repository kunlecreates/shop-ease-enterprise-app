package org.kunlecreates.order.application;

public interface PaymentService {
    /**
     * Charge the given user for the specified amount.
     * @param userId user identifier
     * @param amount amount in major currency units
     * @return true if payment succeeded
     */
    boolean charge(Long userId, double amount);
}
