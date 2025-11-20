package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ORDERS")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "USER_ID", nullable = false)
    private Long userId;
    @Column(name = "STATUS", nullable = false)
    private String status;
    @Column(name = "TOTAL", nullable = false)
    private double total;
    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();
    protected Order() {}
    public Order(Long userId, String status, double total) { this.userId = userId; this.status = status; this.total = total; }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getStatus() { return status; }
    public double getTotal() { return total; }
    public Instant getCreatedAt() { return createdAt; }
}