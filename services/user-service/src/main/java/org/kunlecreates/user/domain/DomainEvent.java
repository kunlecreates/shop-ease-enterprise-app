package org.kunlecreates.user.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "DOMAIN_EVENTS")
public class DomainEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "EVENT_TYPE", nullable = false)
    private String eventType;
    @Column(name = "PAYLOAD", length = 4000)
    private String payload;
    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();
    protected DomainEvent() {}
    public DomainEvent(String eventType, String payload) { this.eventType = eventType; this.payload = payload; }
    public Long getId() { return id; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
}