package org.kunlecreates.order.interfaces;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.interfaces.dto.CreateOrderRequest;
import org.kunlecreates.order.interfaces.dto.OrderResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/order")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * PRD FR010 & FR011: Order tracking and transaction history
     * Users see only their own orders; admins see all orders
     */
    @GetMapping
    public List<OrderResponse> list(Authentication authentication) {
        String currentUserId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        String customerName = extractCustomerNameFromAuth(authentication);
        
        List<Order> orders = orderService.listOrders();
        
        // Admins can see all orders, regular users only see their own
        if (!isAdmin) {
            orders = orders.stream()
                .filter(order -> currentUserId.equals(order.getUserRef()))
                .collect(Collectors.toList());
        }
        
        // Map to OrderResponse with customerName extracted from JWT
        return orders.stream()
                .map(order -> toOrderResponse(order, customerName))
                .collect(Collectors.toList());
    }

    /**
     * PRD FR010: Order tracking with ownership validation
     * Users can only view their own orders unless they are admin
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(@PathVariable Long id, Authentication authentication) {
        String currentUserId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        String customerName = extractCustomerNameFromAuth(authentication);
        
        return orderService.findById(id)
                .map(order -> {
                    // Check ownership: user must own the order OR be an admin
                    if (!currentUserId.equals(order.getUserRef()) && !isAdmin) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<OrderResponse>body(null);
                    }
                    OrderResponse response = toOrderResponse(order, customerName);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).<OrderResponse>body(null));
    }

    /**
     * PRD FR008: Checkout process
     * Extract userId from JWT claims to ensure user is creating order for themselves
     */
    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req, 
                                        Authentication authentication,
                                        HttpServletRequest request,
                                        UriComponentsBuilder uriBuilder) {
        // PRD FR015: Security - Extract userId from JWT, don't trust request body
        String authenticatedUserId = extractUserIdFromAuth(authentication);
        
        // Extract JWT token from Authorization header for notification service
        String jwtToken = extractJwtToken(request);
        
        // Extract shipping address fields
        String shippingRecipient = req.shippingAddress() != null ? req.shippingAddress().recipient() : null;
        String shippingStreet1 = req.shippingAddress() != null ? req.shippingAddress().street1() : null;
        String shippingStreet2 = req.shippingAddress() != null ? req.shippingAddress().street2() : null;
        String shippingCity = req.shippingAddress() != null ? req.shippingAddress().city() : null;
        String shippingState = req.shippingAddress() != null ? req.shippingAddress().state() : null;
        String shippingPostalCode = req.shippingAddress() != null ? req.shippingAddress().postalCode() : null;
        String shippingCountry = req.shippingAddress() != null ? req.shippingAddress().country() : null;
        String shippingPhone = req.shippingAddress() != null ? req.shippingAddress().phone() : null;
        
        // Extract payment method fields
        String paymentMethodType = req.paymentMethod() != null ? req.paymentMethod().type() : null;
        String paymentLast4 = req.paymentMethod() != null ? req.paymentMethod().last4() : null;
        String paymentBrand = req.paymentMethod() != null ? req.paymentMethod().brand() : null;
        
        // Create order with authenticated user's ID (ignore userId from request body for security)
        Order created = orderService.createOrder(
            authenticatedUserId, null, req.status(), req.total(), jwtToken,
            shippingRecipient, shippingStreet1, shippingStreet2, shippingCity,
            shippingState, shippingPostalCode, shippingCountry, shippingPhone,
            paymentMethodType, paymentLast4, paymentBrand
        );
        
        URI location = uriBuilder.path("/api/order/{id}").buildAndExpand(created.getId()).toUri();
        
        // Extract customer name from JWT for response
        String customerName = extractCustomerNameFromAuth(authentication);
        
        // Return order details in response body for frontend confirmation
        OrderResponse response = new OrderResponse(
            created.getId(),
            created.getUserRef(),
            customerName,
            created.getStatus(),
            created.getTotalCents(),
            created.getCurrency(),
            created.getPlacedAt(),
            created.getCreatedAt(),
            created.getUpdatedAt(),
            req.shippingAddress(),
            req.paymentMethod()
        );
        return ResponseEntity.created(location).body(response);
    }

    /**
     * Extract user ID from JWT token or test authentication
     * Supports both JWT (production) and String username (test with @WithMockUser)
     */
    private String extractUserIdFromAuth(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("sub");
        } else if (authentication.getPrincipal() instanceof String username) {
            // For tests using @WithMockUser, username is the user ID
            return username;
        } else if (authentication.getName() != null) {
            // For @WithMockUser, getName() returns the username
            return authentication.getName();
        }
        throw new IllegalStateException("Invalid authentication principal: " + authentication.getPrincipal().getClass());
    }

    /**
     * Check if user has specific role
     */
    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + role));
    }
    
    /**
     * Extract customer full name from JWT token claims
     * Returns fullName or "Customer" as fallback
     */
    private String extractCustomerNameFromAuth(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String fullName = jwt.getClaimAsString("fullName");
            return (fullName != null && !fullName.isEmpty()) ? fullName : "Customer";
        }
        return "Customer";
    }
    
    /**
     * Convert Order entity to OrderResponse DTO with customerName
     */
    private OrderResponse toOrderResponse(Order order, String customerName) {
        return new OrderResponse(
            order.getId(),
            order.getUserRef(),
            customerName,
            order.getStatus(),
            order.getTotalCents(),
            order.getCurrency(),
            order.getPlacedAt(),
            order.getCreatedAt(),
            order.getUpdatedAt(),
            new org.kunlecreates.order.interfaces.dto.ShippingAddress(
                order.getShippingRecipient(),
                order.getShippingStreet1(),
                order.getShippingStreet2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry(),
                order.getShippingPhone()
            ),
            new org.kunlecreates.order.interfaces.dto.PaymentMethod(
                order.getPaymentMethodType(),
                order.getPaymentLast4(),
                order.getPaymentBrand()
            )
        );
    }
    
    /**
     * Extract JWT token from Authorization header
     * Returns null if header is missing or invalid
     */
    private String extractJwtToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
    
    /**
     * PRD FR010: Update order status (admin only)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody org.kunlecreates.order.interfaces.dto.UpdateOrderStatusRequest request,
            HttpServletRequest httpRequest,
            Authentication authentication) {
        
        if (!hasRole(authentication, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(null);
        }
        
        try {
            org.kunlecreates.order.domain.OrderStatus newStatus = 
                org.kunlecreates.order.domain.OrderStatus.fromString(request.status());
            
            // Extract JWT token for notification service
            String jwtToken = extractJwtToken(httpRequest);
            
            Order updated = orderService.updateStatus(id, newStatus, jwtToken);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(null);
        }
    }
    
    /**
     * PRD FR010: Cancel order (user for PENDING, admin for any)
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id, 
                                              HttpServletRequest request,
                                              Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        String jwtToken = extractJwtToken(request);
        
        try {
            if (isAdmin) {
                Order order = orderService.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));
                Order updated = orderService.updateStatus(id, org.kunlecreates.order.domain.OrderStatus.CANCELLED, jwtToken);
                return ResponseEntity.ok(updated);
            } else {
                Order cancelled = orderService.cancelOrder(id, userId);
                return ResponseEntity.ok(cancelled);
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(null);
        }
    }
    
    /**
     * PRD FR010: Refund order (admin only)
     */
    @PostMapping("/{id}/refund")
    public ResponseEntity<Order> refundOrder(@PathVariable Long id, Authentication authentication) {
        if (!hasRole(authentication, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            Order refunded = orderService.refundOrder(id);
            return ResponseEntity.ok(refunded);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * PRD FR010: Get order tracking/history
     */
    @GetMapping("/{id}/tracking")
    public ResponseEntity<List<org.kunlecreates.order.domain.OrderEvent>> getOrderTracking(
            @PathVariable Long id,
            Authentication authentication) {
        
        String userId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        
        return orderService.findById(id)
                .map(order -> {
                    if (!order.getUserRef().equals(userId) && !isAdmin) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<List<org.kunlecreates.order.domain.OrderEvent>>build();
                    }
                    List<org.kunlecreates.order.domain.OrderEvent> events = orderService.getOrderHistory(id);
                    return ResponseEntity.ok(events);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
