package org.kunlecreates.order.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.kunlecreates.order.application.CartService;
import org.kunlecreates.order.domain.Cart;
import org.kunlecreates.order.domain.CartItem;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.repository.CartRepository;
import org.kunlecreates.order.repository.CartItemRepository;
import org.kunlecreates.order.repository.OrderRepository;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private CartService cartService;

    private Cart testCart;
    private List<CartItem> cartItems;

    @BeforeEach
    void setUp() {
        testCart = new Cart("user-456");
        ReflectionTestUtils.setField(testCart, "id", 10L);
        
        cartItems = new ArrayList<>();
        CartItem item1 = new CartItem(testCart, "product-A", 2, 5000L);
        CartItem item2 = new CartItem(testCart, "product-B", 1, 7500L);
        ReflectionTestUtils.setField(item1, "id", 1L);
        ReflectionTestUtils.setField(item2, "id", 2L);
        cartItems.add(item1);
        cartItems.add(item2);
    }

    @Test
    void addItem_toExistingCart_shouldAddNewItem() {
        when(cartRepository.findById(10L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdAndProductRef(10L, "product-C")).thenReturn(Optional.empty());
        CartItem newItem = new CartItem(testCart, "product-C", 3, 12000L);
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(newItem);

        CartItem result = cartService.addItem(10L, "product-C", 3, 12000L);

        assertThat(result.getProductRef()).isEqualTo("product-C");
        assertThat(result.getQuantity()).isEqualTo(3);
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    void addItem_whenProductAlreadyExists_shouldUpdateQuantity() {
        CartItem existingItem = new CartItem(testCart, "product-A", 2, 5000L);
        ReflectionTestUtils.setField(existingItem, "id", 1L);
        
        when(cartRepository.findById(10L)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartIdAndProductRef(10L, "product-A"))
                .thenReturn(Optional.of(existingItem));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(existingItem);

        CartItem result = cartService.addItem(10L, "product-A", 3, 5000L);

        assertThat(result.getQuantity()).isEqualTo(5);
        verify(cartItemRepository).save(existingItem);
    }

    @Test
    void addItem_whenCartIsClosed_shouldThrowException() {
        Cart closedCart = new Cart("user-789");
        closedCart.setStatus("CHECKED_OUT");
        when(cartRepository.findById(20L)).thenReturn(Optional.of(closedCart));

        assertThatThrownBy(() -> cartService.addItem(20L, "product-X", 1, 5000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cart is closed");

        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void updateItemQuantity_shouldModifyExistingItem() {
        CartItem item = new CartItem(testCart, "product-D", 5, 10000L);
        ReflectionTestUtils.setField(item, "id", 3L);
        when(cartItemRepository.findById(3L)).thenReturn(Optional.of(item));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(item);

        cartService.updateItemQuantity(3L, 10);

        assertThat(item.getQuantity()).isEqualTo(10);
        verify(cartItemRepository).save(item);
    }

    @Test
    void updateItemQuantity_whenItemNotFound_shouldThrowException() {
        when(cartItemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.updateItemQuantity(999L, 5))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cart item not found");
    }

    @Test
    void removeItem_shouldDeleteCartItem() {
        doNothing().when(cartItemRepository).deleteById(1L);

        cartService.removeItem(1L);

        verify(cartItemRepository).deleteById(1L);
    }

    @Test
    void checkout_whenUserDoesNotOwnCart_shouldThrowException() {
        when(cartRepository.findByIdWithItems(10L)).thenReturn(Optional.of(testCart));

        assertThatThrownBy(() -> cartService.checkout(10L, "different-user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unauthorized");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void checkout_whenCartIsNotOpen_shouldThrowException() {
        Cart closedCart = new Cart("user-456");
        closedCart.setStatus("CHECKED_OUT");
        when(cartRepository.findByIdWithItems(10L)).thenReturn(Optional.of(closedCart));

        assertThatThrownBy(() -> cartService.checkout(10L, "user-456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cart is not open");
    }

    @Test
    void checkout_whenCartIsEmpty_shouldThrowException() {
        ReflectionTestUtils.setField(testCart, "items", new ArrayList<>());
        when(cartRepository.findByIdWithItems(10L)).thenReturn(Optional.of(testCart));

        assertThatThrownBy(() -> cartService.checkout(10L, "user-456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cart is empty");
    }

    @Test
    void checkout_shouldCalculateTotalCorrectly() {
        ReflectionTestUtils.setField(testCart, "items", cartItems);
        when(cartRepository.findByIdWithItems(10L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        
        Order savedOrder = new Order("user-456", "PENDING", 17500L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = cartService.checkout(10L, "user-456");

        assertThat(result.getTotalCents()).isEqualTo(17500L);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void checkout_shouldCloseCart() {
        ReflectionTestUtils.setField(testCart, "items", cartItems);
        when(cartRepository.findByIdWithItems(10L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        when(orderRepository.save(any(Order.class))).thenReturn(new Order("user-456", "PENDING", 17500L));

        cartService.checkout(10L, "user-456");

        assertThat(testCart.getStatus()).isEqualTo("CHECKED_OUT");
        verify(cartRepository).save(testCart);
    }

    @Test
    void checkout_shouldCreateOrderFromCartItems() {
        ReflectionTestUtils.setField(testCart, "items", cartItems);
        when(cartRepository.findByIdWithItems(10L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        
        Order savedOrder = new Order("user-456", "PENDING", 17500L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = cartService.checkout(10L, "user-456");

        assertThat(result.getUserRef()).isEqualTo("user-456");
        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void clearCart_shouldDeleteAllItems() {
        Cart cart = new Cart("user-100");
        ReflectionTestUtils.setField(cart, "items", cartItems);
        when(cartRepository.findById(10L)).thenReturn(Optional.of(cart));
        doNothing().when(cartItemRepository).deleteAll(anyList());

        cartService.clearCart(10L);

        verify(cartItemRepository).deleteAll(cartItems);
    }

    @Test
    void closeCart_shouldChangeStatusToCheckedOut() {
        when(cartRepository.findById(10L)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        cartService.closeCart(10L);

        assertThat(testCart.getStatus()).isEqualTo("CHECKED_OUT");
        verify(cartRepository).save(testCart);
    }
}
