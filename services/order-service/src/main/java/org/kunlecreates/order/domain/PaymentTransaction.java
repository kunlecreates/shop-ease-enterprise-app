package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payment_transactions", schema = "order_svc")
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "type", nullable = false, length = 32)
    private String type;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "amount_cents", nullable = false)
    private Long amountCents;

    @Column(name = "raw")
    private String raw;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected PaymentTransaction() {}
    public PaymentTransaction(Payment payment, String type, String status, Long amountCents) {
        this.payment = payment; this.type = type; this.status = status; this.amountCents = amountCents;
    }
    public Long getId() { return id; }
}
