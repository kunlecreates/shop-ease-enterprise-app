package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "order_events", schema = "order_svc")
public class OrderEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "type", nullable = false, length = 64)
    private String type;

    @Column(name = "payload")
    private String payload;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected OrderEvent() {}
    public OrderEvent(Long orderId, String type, String payload) { this.orderId = orderId; this.type = type; this.payload = payload; }
    public Long getId() { return id; }
}
