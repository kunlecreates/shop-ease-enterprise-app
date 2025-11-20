package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "PAYMENTS")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "ORDER_ID", nullable = false)
    private Long orderId;
    @Column(name = "AMOUNT", nullable = false)
    private double amount;
    @Column(name = "STATUS", nullable = false)
    private String status;
    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();
    protected Payment() {}
    public Payment(Long orderId, double amount, String status) { this.orderId = orderId; this.amount = amount; this.status = status; }
    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public double getAmount() { return amount; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}