package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "carts", schema = "order_svc")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_ref", nullable = false, length = 64)
    private String userRef;
    @Column(name = "status", nullable = false, length = 32)
    private String status;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
    protected Cart() {}
    public Cart(String userRef) { this.userRef = userRef; this.status = "OPEN"; }
    public Long getId() { return id; }
    public String getUserRef() { return userRef; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}