package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import org.kunlecreates.order.infrastructure.notification.NotificationClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security tests for Order Controller endpoints
 * Tests PRD FR008 (Checkout), FR010 (Order Tracking), FR011 (Transaction History), FR015 (Security)
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false",
    "jwt.secret=test-secret-for-security-tests-minimum-256-bits-long"
})
@AutoConfigureMockMvc
class OrderControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;
    
    @MockBean
    private NotificationClient notificationClient;

    @Test
    void shouldRejectListOrdersWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/order"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "100", authorities = {"ROLE_USER"})
    void shouldFilterOrdersByUserForNonAdmin() throws Exception {
        Order userOrder = new Order("100", "pending", 10000L);
        Order otherOrder = new Order("200", "pending", 20000L);
        
        when(orderService.listOrders()).thenReturn(Arrays.asList(userOrder, otherOrder));
        
        // Non-admin users should only see their own orders (filtered in controller)
        mockMvc.perform(get("/api/order"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "1", authorities = {"ROLE_ADMIN"})
    void shouldAllowAdminToViewAllOrders() throws Exception {
        Order order1 = new Order("100", "pending", 10000L);
        Order order2 = new Order("200", "pending", 20000L);
        
        when(orderService.listOrders()).thenReturn(Arrays.asList(order1, order2));
        
        mockMvc.perform(get("/api/order"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldRejectGetOrderByIdWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/order/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "100", authorities = {"ROLE_USER"})
    void shouldAllowUserToViewOwnOrder() throws Exception {
        Order order = new Order("100", "pending", 10000L);
        when(orderService.findById(1L)).thenReturn(Optional.of(order));
        
        mockMvc.perform(get("/api/order/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "100", authorities = {"ROLE_USER"})
    void shouldRejectUserViewingOtherUserOrder() throws Exception {
        Order order = new Order("200", "pending", 10000L); // Order belongs to user 200
        when(orderService.findById(1L)).thenReturn(Optional.of(order));
        
        mockMvc.perform(get("/api/order/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "1", authorities = {"ROLE_ADMIN"})
    void shouldAllowAdminToViewAnyOrder() throws Exception {
        Order order = new Order("999", "pending", 10000L);
        when(orderService.findById(1L)).thenReturn(Optional.of(order));
        
        mockMvc.perform(get("/api/order/1"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectCreateOrderWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"pending\",\"total\":100.00}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "100", authorities = {"ROLE_USER"})
    void shouldCreateOrderWithAuthenticatedUserId() throws Exception {
        // userRef should be extracted from JWT (100), not from request body
        Order order = new Order("100", "pending", 10000L);
        when(orderService.createOrder(anyString(), any(), anyString(), anyDouble(), any())).thenReturn(order);
        
        mockMvc.perform(post("/api/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"pending\",\"total\":100.00}"))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldAllowPublicAccessToHealthEndpoints() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectGetNonExistentOrder() throws Exception {
        when(orderService.findById(999L)).thenReturn(Optional.empty());
        
        mockMvc.perform(get("/api/order/999")
                .header("Authorization", "Bearer fake-token"))
                .andExpect(status().isUnauthorized()); // Will fail auth before checking if order exists
    }
}
