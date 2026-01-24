package org.kunlecreates.order.application;

import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.repository.CartItemRepository;
import org.kunlecreates.order.repository.CartRepository;
import org.kunlecreates.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;

    public CartService(
            CartRepository cartRepository, 
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
    }
    public Cart getOrCreateActiveCart(String userRef) {
        return cartRepository.findByUserRefAndStatus(userRef, "OPEN")
                .orElseGet(() -> cartRepository.save(new Cart(userRef)));
    }

    @Transactional(readOnly = true)
    public Optional<Cart> findById(Long cartId) {
        return cartRepository.findById(cartId);
    }

    @Transactional
    public CartItem addItem(Long cartId, String productRef, Integer quantity, Long unitPriceCents) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        
        if (!cart.isOpen()) {
            throw new IllegalStateException("Cart is closed");
        }

        Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductRef(cartId, productRef);
        
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, productRef, quantity, unitPriceCents);
            return cartItemRepository.save(newItem);
        }
    }

    @Transactional
    public void updateItemQuantity(Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        item.setQuantity(quantity);
        cartItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long itemId) {
        cartItemRepository.deleteById(itemId);
    }

    @Transactional
    public void clearCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        cartItemRepository.deleteAll(cart.getItems());
    }

    @Transactional
    public void closeCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        cart.close();
        cartRepository.save(cart);
    }

    @Transactional
    public Order checkout(Long cartId) {
        // Use JOIN FETCH to eagerly load cart items within transaction
        Cart cart = cartRepository.findByIdWithItems(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        
        if (!cart.isOpen()) {
            throw new IllegalStateException("Cart is not open");
        }
        
        // Access items within transaction (already loaded via JOIN FETCH)
        List<CartItem> items = cart.getItems();
        
        if (items.isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }
        
        // Calculate total from cart items
        long totalCents = items.stream()
                .mapToLong(item -> item.getUnitPriceCents() * item.getQuantity())
                .sum();
        
        // Create order
        Order order = new Order(cart.getUserRef(), "PENDING", totalCents);
        order = orderRepository.save(order);
        
        // Close the cart
        cart.close();
        cartRepository.save(cart);
        
        return order;
    }
}
