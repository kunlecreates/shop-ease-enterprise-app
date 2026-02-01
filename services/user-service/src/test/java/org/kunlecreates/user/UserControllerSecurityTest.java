package org.kunlecreates.user;

import org.junit.jupiter.api.Test;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security tests for User Controller endpoints
 * Tests PRD FR002 (Profile Management), FR003 (Role-Based Access), and NFR010 (GDPR Compliance)
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false",
    "jwt.secret=test-secret-for-security-tests-minimum-256-bits-long"
})
@AutoConfigureMockMvc
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    private User createUserWithId(Long id, String email, String password) throws Exception {
        User user = new User(email, password);
        Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(user, id);
        return user;
    }

    @Test
    void shouldRejectListUsersWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user", roles = {"USER"})
    void shouldRejectListUsersForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldAllowListUsersForAdmin() throws Exception {
        when(userService.listUsers()).thenReturn(List.of());
        
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectGetUserByIdWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/user/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "1", authorities = {"ROLE_USER"})
    void shouldAllowUserToViewOwnProfile() throws Exception {
        User user = createUserWithId(1L, "test@example.com", "hashedpwd");
        when(userService.findById(1L)).thenReturn(Optional.of(user));
        
        mockMvc.perform(get("/api/user/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "100", authorities = {"ROLE_USER"})
    void shouldRejectUserViewingOtherUserProfile() throws Exception {
        mockMvc.perform(get("/api/user/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "1", authorities = {"ROLE_ADMIN"})
    void shouldAllowAdminToViewAnyUserProfile() throws Exception {
        User user = createUserWithId(999L, "test@example.com", "hashedpwd");
        when(userService.findById(anyLong())).thenReturn(Optional.of(user));
        
        mockMvc.perform(get("/api/user/999"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "100", authorities = {"ROLE_USER"})
    void shouldAllowUserToGetOwnProfileViaProfileEndpoint() throws Exception {
        User user = createUserWithId(100L, "test@example.com", "hashedpwd");
        when(userService.findById(100L)).thenReturn(Optional.of(user));
        
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectGetProfileWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectCreateUserWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"password\":\"hashedpwd\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user", roles = {"USER"})
    void shouldRejectCreateUserForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"password\":\"hashedpwd\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldAllowCreateUserForAdmin() throws Exception {
        User user = new User("test@example.com", "hashedpwd");
        when(userService.createUser("test@example.com", "hashedpwd")).thenReturn(user);
        
        mockMvc.perform(post("/api/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"password\":\"hashedpwd\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldAllowPublicAccessToHealthEndpoints() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}
