package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "orders", schema = "order_svc")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_ref", nullable = false, length = 64)
    private String userRef;
    @Column(name = "status", nullable = false, length = 32)
    private String status;
    @Column(name = "total_cents", nullable = false)
    private Long totalCents;
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";
    @Column(name = "placed_at")
    private Instant placedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
    protected Order() {}
    public Order(String userRef, String status, Long totalCents) { this.userRef = userRef; this.status = status; this.totalCents = totalCents; }
    public Long getId() { return id; }
    public String getUserRef() { return userRef; }
    public String getStatus() { return status; }
    // Expose total as decimal dollars for API compatibility
    public double getTotal() { return (totalCents == null) ? 0.0 : totalCents / 100.0; }
    public Long getTotalCents() { return totalCents; }
    public Instant getCreatedAt() { return createdAt; }
}