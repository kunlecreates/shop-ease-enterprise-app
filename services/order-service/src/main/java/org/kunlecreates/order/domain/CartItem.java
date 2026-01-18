package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "cart_items", schema = "order_svc")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Column(name = "product_ref", nullable = false, length = 64)
    private String productRef;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price_cents", nullable = false)
    private Long unitPriceCents;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected CartItem() {}
    
    public CartItem(Cart cart, String productRef, Integer quantity, Long unitPriceCents) {
        this.cart = cart; 
        this.productRef = productRef; 
        this.quantity = quantity; 
        this.unitPriceCents = unitPriceCents;
    }
    
    public Long getId() { return id; }
    public Cart getCart() { return cart; }
    public String getProductRef() { return productRef; }
    public Integer getQuantity() { return quantity; }
    public Long getUnitPriceCents() { return unitPriceCents; }
    public String getCurrency() { return currency; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        this.updatedAt = Instant.now();
    }
    
    public void setUnitPriceCents(Long unitPriceCents) {
        this.unitPriceCents = unitPriceCents;
        this.updatedAt = Instant.now();
    }
}
