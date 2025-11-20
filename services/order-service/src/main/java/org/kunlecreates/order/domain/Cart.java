package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "CARTS")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "USER_ID", nullable = false)
    private Long userId;
    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();
    protected Cart() {}
    public Cart(Long userId) { this.userId = userId; }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; }
}