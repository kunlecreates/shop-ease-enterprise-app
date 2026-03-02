package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "order_items", schema = "order_svc")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_ref", nullable = false, length = 64)
    private String productRef;

    @Column(name = "product_name", length = 255)
    private String productName;

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

    protected OrderItem() {}
    public OrderItem(Order order, String productRef, String productName, Integer quantity, Long unitPriceCents) {
        this.order = order;
        this.productRef = productRef;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPriceCents = unitPriceCents;
    }
    public Long getId() { return id; }
    public Order getOrder() { return order; }
    public String getProductRef() { return productRef; }
    public String getProductName() { return productName; }
    public Integer getQuantity() { return quantity; }
    public Long getUnitPriceCents() { return unitPriceCents; }
}
