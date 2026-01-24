package org.kunlecreates.order.interfaces;

import jakarta.validation.Valid;
import org.kunlecreates.order.application.CartService;
import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;
import org.kunlecreates.order.interfaces.dto.AddCartItemRequest;
import org.kunlecreates.order.interfaces.dto.CartResponse;
import org.kunlecreates.order.interfaces.dto.UpdateCartItemRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    private String extractUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("sub");
        }
        return "anonymous";
    }

    @GetMapping("/{id}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long id, Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        
        return cartService.findById(id)
                .map(cart -> {
                    if (!cart.getUserRef().equals(userId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<CartResponse>build();
                    }
                    return ResponseEntity.ok(CartResponse.from(cart));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<CartResponse> getActiveCart(Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        Cart cart = cartService.getOrCreateActiveCart(userId);
        return ResponseEntity.ok(CartResponse.from(cart));
    }

    @PostMapping
    public ResponseEntity<CartResponse> createCart(
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication,
            UriComponentsBuilder uriBuilder) {
        
        String userId = extractUserIdFromAuth(authentication);
        
        // If user_ref is provided in body, use it (for compatibility)
        if (body != null && body.containsKey("user_ref")) {
            userId = body.get("user_ref");
        }
        
        Cart cart = cartService.getOrCreateActiveCart(userId);
        
        URI location = uriBuilder.path("/api/cart/{id}")
                .buildAndExpand(cart.getId())
                .toUri();
        
        return ResponseEntity.created(location).body(CartResponse.from(cart));
    }

    @PostMapping("/{cartId}/items")
    public ResponseEntity<Void> addItem(
            @PathVariable Long cartId,
            @Valid @RequestBody AddCartItemRequest request,
            Authentication authentication,
            UriComponentsBuilder uriBuilder) {
        
        String userId = extractUserIdFromAuth(authentication);
        
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        
        if (!cart.getUserRef().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        CartItem item = cartService.addItem(
                cartId,
                request.productRef(),
                request.quantity(),
                request.unitPriceCents()
        );

        URI location = uriBuilder.path("/api/cart/{cartId}/items/{itemId}")
                .buildAndExpand(cartId, item.getId())
                .toUri();

        return ResponseEntity.created(location).build();
    }

    @PatchMapping("/{cartId}/items/{itemId}")
    public ResponseEntity<Void> updateItem(
            @PathVariable Long cartId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {
        
        String userId = extractUserIdFromAuth(authentication);
        
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        
        if (!cart.getUserRef().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        cartService.updateItemQuantity(itemId, request.quantity());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{cartId}/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @PathVariable Long cartId,
            @PathVariable Long itemId,
            Authentication authentication) {
        
        String userId = extractUserIdFromAuth(authentication);
        
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        
        if (!cart.getUserRef().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        cartService.removeItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{cartId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long cartId, Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        
        Cart cart = cartService.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        
        if (!cart.getUserRef().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        cartService.clearCart(cartId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{cartId}/checkout")
    public ResponseEntity<java.util.Map<String, Object>> checkout(
            @PathVariable Long cartId,
            Authentication authentication) {
        
        String userId = extractUserIdFromAuth(authentication);
        
        // Create order from cart - authorization check is inside checkout method
        org.kunlecreates.order.domain.Order order = cartService.checkout(cartId, userId);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("orderId", order.getId());
        response.put("cartId", cartId);
        response.put("message", "Order created successfully");
        
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
