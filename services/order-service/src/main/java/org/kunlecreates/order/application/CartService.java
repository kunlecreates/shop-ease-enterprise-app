package org.kunlecreates.order.application;

import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;
import org.kunlecreates.order.repository.CartItemRepository;
import org.kunlecreates.order.repository.CartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    @Transactional
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
}
