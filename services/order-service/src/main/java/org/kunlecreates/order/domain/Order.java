package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
    
    @Transient
    private List<OrderEvent> domainEvents = new ArrayList<>();
    
    protected Order() {}
    
    public Order(String userRef, String status, Long totalCents) { 
        this.userRef = userRef; 
        this.status = status; 
        this.totalCents = totalCents; 
    }
    
    public Long getId() { return id; }
    public String getUserRef() { return userRef; }
    public String getStatus() { return status; }
    public Instant getPlacedAt() { return placedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Long getTotalCents() { return totalCents; }
    public String getCurrency() { return currency; }
    public List<OrderEvent> getDomainEvents() { return new ArrayList<>(domainEvents); }
    
    public double getTotal() { 
        return (totalCents == null) ? 0.0 : totalCents / 100.0; 
    }
    
    public Instant getCreatedAt() { return createdAt; }
    
    public void clearDomainEvents() {
        domainEvents.clear();
    }
    
    public void transitionTo(OrderStatus newStatus) {
        OrderStatus currentStatus = OrderStatus.fromString(this.status);
        
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Invalid status transition from %s to %s", currentStatus, newStatus)
            );
        }
        
        String previousStatus = this.status;
        this.status = newStatus.getValue();
        this.updatedAt = Instant.now();
        
        domainEvents.add(new OrderEvent(
            this.id,
            previousStatus,
            this.status,
            this.updatedAt
        ));
    }
    
    public void cancel() {
        transitionTo(OrderStatus.CANCELLED);
    }
    
    public void markAsPaid() {
        transitionTo(OrderStatus.PAID);
        if (this.placedAt == null) {
            this.placedAt = Instant.now();
        }
    }
    
    public void ship() {
        transitionTo(OrderStatus.SHIPPED);
    }
    
    public void deliver() {
        transitionTo(OrderStatus.DELIVERED);
    }
    
    public void refund() {
        transitionTo(OrderStatus.REFUNDED);
    }
}