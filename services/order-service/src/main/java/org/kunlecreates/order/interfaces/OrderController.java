package org.kunlecreates.order.interfaces;

import jakarta.validation.Valid;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.interfaces.dto.CreateOrderRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/order")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<Order> list() {
        return orderService.listOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> get(@PathVariable Long id) {
        return orderService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody CreateOrderRequest req, UriComponentsBuilder uriBuilder) {
        Order created = orderService.createOrder(req.userRef(), req.userId(), req.status(), req.total());
        URI location = uriBuilder.path("/api/order/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).build();
    }
}
