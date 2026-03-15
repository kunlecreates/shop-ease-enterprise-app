package org.kunlecreates.order.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.order.application.CartService;
import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.interfaces.CartController;
import org.kunlecreates.order.interfaces.dto.AddCartItemRequest;
import org.kunlecreates.order.interfaces.dto.UpdateCartItemRequest;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartControllerTest {

    @Mock
    private CartService cartService;

    private CartController controller;

    @BeforeEach
    void setUp() {
        controller = new CartController(cartService);
    }

    @Test
    void getCart_shouldReturnForbiddenWhenCartBelongsToAnotherUser() {
        Cart cart = new Cart("owner-1");
        ReflectionTestUtils.setField(cart, "id", 1L);
        when(cartService.findById(1L)).thenReturn(Optional.of(cart));

        ResponseEntity<?> response = controller.getCart(1L, jwtAuth("other-user"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getCart_shouldReturnNotFoundWhenMissing() {
        when(cartService.findById(2L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getCart(2L, jwtAuth("user-2"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void createCart_shouldUseBodyUserRefWhenProvided() {
        Cart cart = new Cart("body-user");
        ReflectionTestUtils.setField(cart, "id", 9L);
        when(cartService.getOrCreateActiveCart("body-user")).thenReturn(cart);

        ResponseEntity<?> response = controller.createCart(
                Map.of("user_ref", "body-user"),
                jwtAuth("jwt-user"),
                UriComponentsBuilder.newInstance()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).hasPath("/api/cart/9");
    }

    @Test
    void createCart_shouldUseAuthenticatedUserWhenBodyIsNull() {
        Cart cart = new Cart("jwt-user");
        ReflectionTestUtils.setField(cart, "id", 10L);
        when(cartService.getOrCreateActiveCart("jwt-user")).thenReturn(cart);

        ResponseEntity<?> response = controller.createCart(
                null,
                jwtAuth("jwt-user"),
                UriComponentsBuilder.newInstance()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).hasPath("/api/cart/10");
    }

    @Test
    void getCart_shouldReturnOkForOwner() {
        Cart cart = new Cart("owner-11");
        ReflectionTestUtils.setField(cart, "id", 11L);
        when(cartService.findById(11L)).thenReturn(Optional.of(cart));

        ResponseEntity<?> response = controller.getCart(11L, jwtAuth("owner-11"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getActiveCart_shouldReturnOkForAuthenticatedUser() {
        Cart cart = new Cart("active-user");
        ReflectionTestUtils.setField(cart, "id", 12L);
        when(cartService.getOrCreateActiveCart("active-user")).thenReturn(cart);

        ResponseEntity<?> response = controller.getActiveCart(jwtAuth("active-user"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void addItem_shouldReturnForbiddenForNonOwner() {
        Cart cart = new Cart("owner-3");
        ReflectionTestUtils.setField(cart, "id", 3L);
        when(cartService.findById(3L)).thenReturn(Optional.of(cart));

        ResponseEntity<Void> response = controller.addItem(
                3L,
                new AddCartItemRequest("SKU-1", 1, 1000L),
                jwtAuth("intruder"),
                UriComponentsBuilder.newInstance()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void addItem_shouldReturnCreatedForOwner() {
        Cart cart = new Cart("owner-3");
        ReflectionTestUtils.setField(cart, "id", 3L);
        CartItem item = new CartItem(cart, "SKU-1", 2, 1000L);
        ReflectionTestUtils.setField(item, "id", 33L);
        when(cartService.findById(3L)).thenReturn(Optional.of(cart));
        when(cartService.addItem(3L, "SKU-1", 2, 1000L)).thenReturn(item);

        ResponseEntity<Void> response = controller.addItem(
                3L,
                new AddCartItemRequest("SKU-1", 2, 1000L),
                jwtAuth("owner-3"),
                UriComponentsBuilder.newInstance()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).hasPath("/api/cart/3/items/33");
    }

    @Test
    void addItem_shouldThrowWhenCartMissing() {
        when(cartService.findById(13L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.addItem(
                13L,
                new AddCartItemRequest("SKU-2", 1, 500L),
                jwtAuth("owner-13"),
                UriComponentsBuilder.newInstance()
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cart not found");
    }

    @Test
    void updateItem_shouldReturnNoContentForOwner() {
        Cart cart = new Cart("owner-4");
        ReflectionTestUtils.setField(cart, "id", 4L);
        when(cartService.findById(4L)).thenReturn(Optional.of(cart));

        ResponseEntity<Void> response = controller.updateItem(
                4L,
                20L,
                new UpdateCartItemRequest(3),
                jwtAuth("owner-4")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(cartService).updateItemQuantity(20L, 3);
    }

    @Test
    void removeItem_shouldReturnNoContentForOwner() {
        Cart cart = new Cart("owner-14");
        ReflectionTestUtils.setField(cart, "id", 14L);
        when(cartService.findById(14L)).thenReturn(Optional.of(cart));

        ResponseEntity<Void> response = controller.removeItem(14L, 41L, jwtAuth("owner-14"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(cartService).removeItem(41L);
    }

    @Test
    void clearCart_shouldReturnNoContentForOwner() {
        Cart cart = new Cart("owner-15");
        ReflectionTestUtils.setField(cart, "id", 15L);
        when(cartService.findById(15L)).thenReturn(Optional.of(cart));

        ResponseEntity<Void> response = controller.clearCart(15L, jwtAuth("owner-15"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(cartService).clearCart(15L);
    }

    @Test
    void clearCart_shouldReturnForbiddenForNonOwner() {
        Cart cart = new Cart("owner-16");
        ReflectionTestUtils.setField(cart, "id", 16L);
        when(cartService.findById(16L)).thenReturn(Optional.of(cart));

        ResponseEntity<Void> response = controller.clearCart(16L, jwtAuth("intruder"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void checkout_shouldReturnAcceptedWithOrderPayload() {
        Order order = new Order("owner-5", "PENDING", 5000L);
        ReflectionTestUtils.setField(order, "id", 99L);
        when(cartService.checkout(5L, "owner-5")).thenReturn(order);

        ResponseEntity<Map<String, Object>> response = controller.checkout(5L, jwtAuth("owner-5"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(response.getBody()).isEqualTo(Map.of(
                "success", true,
                "orderId", 99L,
                "cartId", 5L,
                "message", "Order created successfully"
        ));
    }

    private Authentication jwtAuth(String sub) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", sub)
                .build();
        return new JwtAuthenticationToken(jwt);
    }
}