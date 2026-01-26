package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payments", schema = "order_svc")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    @Column(name = "provider", nullable = false, length = 32)
    private String provider;
    @Column(name = "status", nullable = false, length = 32)
    private String status;
    @Column(name = "amount_cents", nullable = false)
    private Long amountCents;
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";
    @Column(name = "external_ref", length = 128)
    private String externalRef;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
    protected Payment() {}
    public Payment(Long orderId, Long amountCents, String status) { this.orderId = orderId; this.amountCents = amountCents; this.status = status; }
    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public Long getAmountCents() { return amountCents; }
    public double getAmount() { return (amountCents == null) ? 0.0 : amountCents / 100.0; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}