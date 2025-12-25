package org.kunlecreates.user.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "DOMAIN_EVENTS")
public class DomainEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "AGGREGATE_ID", nullable = false, length = 64)
    private String aggregateId;

    @Column(name = "TYPE", nullable = false, length = 100)
    private String type;

    @Lob
    @Column(name = "PAYLOAD")
    private String payload;

    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "PUBLISHED_AT")
    private Instant publishedAt;

    protected DomainEvent() {}

    public DomainEvent(String aggregateId, String type, String payload) {
        this.aggregateId = aggregateId;
        this.type = type;
        this.payload = payload;
    }

    public Long getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getType() { return type; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPublishedAt() { return publishedAt; }
}