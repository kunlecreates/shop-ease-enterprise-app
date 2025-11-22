package org.kunlecreates.order.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MockPaymentService implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentService.class);

    @Override
    public boolean charge(Long userId, double amount) {
        // Simulate a successful payment for testing/dev purposes.
        String tx = UUID.randomUUID().toString();
        log.info("[MockPayment] user={} amount={} tx={}", userId, amount, tx);
        return true;
    }
}
