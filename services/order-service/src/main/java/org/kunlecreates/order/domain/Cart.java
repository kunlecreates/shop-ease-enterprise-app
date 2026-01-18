package org.kunlecreates.order.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
    
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();
    
    protected Cart() {}
    
    public Cart(String userRef) { 
        this.userRef = userRef; 
        this.status = "OPEN"; 
    }
    
    public Long getId() { return id; }
    public String getUserRef() { return userRef; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<CartItem> getItems() { return items; }
    
    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }
    
    public void close() {
        setStatus("CLOSED");
    }
    
    public boolean isOpen() {
        return "OPEN".equals(status);
    }
}