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
    
    @Column(name = "shipping_recipient", length = 255)
    private String shippingRecipient;
    
    @Column(name = "shipping_street1", length = 255)
    private String shippingStreet1;
    
    @Column(name = "shipping_street2", length = 255)
    private String shippingStreet2;
    
    @Column(name = "shipping_city", length = 100)
    private String shippingCity;
    
    @Column(name = "shipping_state", length = 100)
    private String shippingState;
    
    @Column(name = "shipping_postal_code", length = 20)
    private String shippingPostalCode;
    
    @Column(name = "shipping_country", length = 100)
    private String shippingCountry;
    
    @Column(name = "shipping_phone", length = 20)
    private String shippingPhone;
    
    @Column(name = "payment_method_type", length = 50)
    private String paymentMethodType;
    
    @Column(name = "payment_last4", length = 4)
    private String paymentLast4;
    
    @Column(name = "payment_brand", length = 50)
    private String paymentBrand;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_name", length = 255)
    private String customerName;
    
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
    
    public String getShippingRecipient() { return shippingRecipient; }
    public String getShippingStreet1() { return shippingStreet1; }
    public String getShippingStreet2() { return shippingStreet2; }
    public String getShippingCity() { return shippingCity; }
    public String getShippingState() { return shippingState; }
    public String getShippingPostalCode() { return shippingPostalCode; }
    public String getShippingCountry() { return shippingCountry; }
    public String getShippingPhone() { return shippingPhone; }
    
    public String getPaymentMethodType() { return paymentMethodType; }
    public String getPaymentLast4() { return paymentLast4; }
    public String getPaymentBrand() { return paymentBrand; }
    
    public void setShippingRecipient(String shippingRecipient) { this.shippingRecipient = shippingRecipient; }
    public void setShippingStreet1(String shippingStreet1) { this.shippingStreet1 = shippingStreet1; }
    public void setShippingStreet2(String shippingStreet2) { this.shippingStreet2 = shippingStreet2; }
    public void setShippingCity(String shippingCity) { this.shippingCity = shippingCity; }
    public void setShippingState(String shippingState) { this.shippingState = shippingState; }
    public void setShippingPostalCode(String shippingPostalCode) { this.shippingPostalCode = shippingPostalCode; }
    public void setShippingCountry(String shippingCountry) { this.shippingCountry = shippingCountry; }
    public void setShippingPhone(String shippingPhone) { this.shippingPhone = shippingPhone; }
    
    public void setPaymentMethodType(String paymentMethodType) { this.paymentMethodType = paymentMethodType; }
    public void setPaymentLast4(String paymentLast4) { this.paymentLast4 = paymentLast4; }
    public void setPaymentBrand(String paymentBrand) { this.paymentBrand = paymentBrand; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
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