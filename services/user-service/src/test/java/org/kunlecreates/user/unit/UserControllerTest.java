package org.kunlecreates.user.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.user.application.AuthService;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.domain.Role;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.interfaces.UserController;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.kunlecreates.user.interfaces.dto.UpdateProfileRequest;
import org.kunlecreates.user.interfaces.dto.UpdateRoleRequest;
import org.kunlecreates.user.interfaces.dto.UpdateStatusRequest;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private AuthService authService;

    private UserController controller;

    @BeforeEach
    void setUp() {
        controller = new UserController(userService, authService);
    }

    @Test
    void list_shouldMapUsersToResponses() {
        when(userService.listUsers()).thenReturn(List.of(
                buildUser(1L, "a@shop.com", Set.of(new Role("CUSTOMER"))),
                buildUser(2L, "b@shop.com", Set.of(new Role("ADMIN")))
        ));

        assertThat(controller.list()).hasSize(2);
    }

    @Test
    void get_shouldReturnForbiddenForNonOwnerNonAdmin() {
        ResponseEntity<?> response = controller.get(5L, userAuth("1"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void get_shouldReturnOkForOwner() {
        User user = buildUser(5L, "owner@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.findById(5L)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.get(5L, userAuth("5"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void get_shouldAllowAdminAccessToAnyUser() {
        User user = buildUser(6L, "any@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.findById(6L)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.get(6L, adminAuth("1"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void get_shouldReturnNotFoundWhenUserMissing() {
        when(userService.findById(77L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.get(77L, adminAuth("1"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getProfile_shouldExtractUserFromJwtPrincipal() {
        User user = buildUser(15L, "jwt@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.findById(15L)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.getProfile(jwtAuth("15", "USER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userService).findById(15L);
    }

    @Test
    void getProfile_shouldReturnNotFoundWhenMissing() {
        when(userService.findById(16L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getProfile(jwtAuth("16", "USER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getMe_shouldDelegateToProfile() {
        User user = buildUser(17L, "me@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.findById(17L)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.getMe(userAuth("17"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void register_shouldReturnBadRequestOnDuplicateUser() {
        CreateUserRequest request = new CreateUserRequest("taken@shop.com", "pass");
        when(authService.register(request)).thenThrow(new IllegalArgumentException("User already exists"));

        ResponseEntity<?> response = controller.register(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void register_shouldReturnCreatedOnSuccess() {
        CreateUserRequest request = new CreateUserRequest("new@shop.com", "pass");
        AuthResponse authResponse = new AuthResponse("jwt", "9", "new@shop.com",
                new AuthResponse.UserInfo("9", "new", "new@shop.com", "CUSTOMER"));
        when(authService.register(request)).thenReturn(authResponse);

        ResponseEntity<?> response = controller.register(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(authResponse);
    }

    @Test
    void login_shouldReturnUnauthorizedOnInvalidCredentials() {
        LoginRequest request = new LoginRequest("bad@shop.com", "bad");
        when(authService.login(request)).thenThrow(new IllegalArgumentException("Invalid"));

        ResponseEntity<?> response = controller.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "Invalid email or password"));
    }

    @Test
    void login_shouldReturnOkOnSuccess() {
        LoginRequest request = new LoginRequest("ok@shop.com", "ok");
        AuthResponse authResponse = new AuthResponse("jwt", "10", "ok@shop.com",
                new AuthResponse.UserInfo("10", "ok", "ok@shop.com", "CUSTOMER"));
        when(authService.login(request)).thenReturn(authResponse);

        ResponseEntity<?> response = controller.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(authResponse);
    }

    @Test
    void create_shouldReturnCreatedWithLocation() {
        User user = buildUser(9L, "new@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.createUser("new@shop.com", "hash")).thenReturn(user);

        ResponseEntity<Void> response = controller.create(
                new CreateUserRequest("new@shop.com", "hash"),
                UriComponentsBuilder.newInstance()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).hasPath("/api/user/9");
    }

    @Test
    void logout_shouldReturnOk() {
        ResponseEntity<Void> response = controller.logout();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateProfile_shouldReturnBadRequestWhenPasswordChangeFails() {
        doThrow(new IllegalArgumentException("wrong"))
            .when(userService).changePassword(20L, "wrong", "newpass");

        ResponseEntity<?> response = controller.updateProfile(
                new UpdateProfileRequest("A", "B", "a@shop.com", "wrong", "newpass"),
                userAuth("20")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(userService, never()).updateProfile(20L, "A", "B", "a@shop.com");
    }

    @Test
    void updateProfile_shouldReturnNotFoundWhenProfileMissing() {
        when(userService.updateProfile(21L, "A", "B", "a@shop.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.updateProfile(
                new UpdateProfileRequest("A", "B", "a@shop.com", null, null),
                userAuth("21")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateProfile_shouldReturnBadRequestOnIllegalArgument() {
        when(userService.updateProfile(22L, "A", "B", "a@shop.com")).thenThrow(new IllegalArgumentException("bad"));

        ResponseEntity<?> response = controller.updateProfile(
                new UpdateProfileRequest("A", "B", "a@shop.com", null, null),
                userAuth("22")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateProfile_shouldReturnOkWhenUpdated() {
        User updated = buildUser(23L, "new@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.updateProfile(23L, "A", "B", "new@shop.com")).thenReturn(Optional.of(updated));

        ResponseEntity<?> response = controller.updateProfile(
                new UpdateProfileRequest("A", "B", "new@shop.com", null, null),
                userAuth("23")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void deleteUser_shouldReturnForbiddenForNonOwnerNonAdmin() {
        ResponseEntity<Void> response = controller.deleteUser(10L, userAuth("2"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void deleteUser_shouldReturnNoContentForOwnerWhenDeleted() {
        when(userService.deleteUser(10L)).thenReturn(true);

        ResponseEntity<Void> response = controller.deleteUser(10L, userAuth("10"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void deleteUser_shouldReturnNotFoundWhenDeleteFails() {
        when(userService.deleteUser(10L)).thenReturn(false);

        ResponseEntity<Void> response = controller.deleteUser(10L, userAuth("10"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateRole_shouldReturnOkWhenUpdated() {
        User user = buildUser(8L, "role@shop.com", Set.of(new Role("ADMIN")));
        when(userService.updateUserRole(8L, "ADMIN")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.updateRole(8L, new UpdateRoleRequest("ADMIN"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void updateRole_shouldReturnNotFoundWhenMissing() {
        when(userService.updateUserRole(8L, "ADMIN")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.updateRole(8L, new UpdateRoleRequest("ADMIN"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateRole_shouldReturnBadRequestOnInvalidInput() {
        when(userService.updateUserRole(8L, "BOGUS")).thenThrow(new IllegalArgumentException("bad role"));

        ResponseEntity<?> response = controller.updateRole(8L, new UpdateRoleRequest("BOGUS"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateStatus_shouldReturnNotFoundWhenUserMissing() {
        when(userService.updateUserStatus(12L, true)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.updateStatus(12L, new UpdateStatusRequest(true));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateStatus_shouldReturnOkWhenUpdated() {
        User user = buildUser(12L, "active@shop.com", Set.of(new Role("CUSTOMER")));
        when(userService.updateUserStatus(12L, true)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.updateStatus(12L, new UpdateStatusRequest(true));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getRole_shouldReturnRoleAndUserIdForOwner() {
        User user = buildUser(13L, "role@shop.com", Set.of(new Role("admin")));
        when(userService.findById(13L)).thenReturn(Optional.of(user));

        ResponseEntity<Map<String, Object>> response = controller.getRole(13L, userAuth("13"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("role", "ADMIN", "userId", "13"));
    }

    @Test
    void getRole_shouldReturnForbiddenForOtherNonAdmin() {
        ResponseEntity<Map<String, Object>> response = controller.getRole(99L, userAuth("1"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getRole_shouldReturnNotFoundWhenMissing() {
        when(userService.findById(30L)).thenReturn(Optional.empty());

        ResponseEntity<Map<String, Object>> response = controller.getRole(30L, adminAuth("1"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "User not found"));
    }

    @Test
    void getRole_shouldReturnEmptyMapWhenNoRoles() {
        User user = buildUser(31L, "nobody@shop.com", Set.of());
        when(userService.findById(31L)).thenReturn(Optional.of(user));

        ResponseEntity<Map<String, Object>> response = controller.getRole(31L, userAuth("31"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of());
    }

    private Authentication userAuth(String userId) {
        return new TestingAuthenticationToken(userId, "password", "ROLE_USER");
    }

    private Authentication adminAuth(String userId) {
        return new TestingAuthenticationToken(userId, "password", "ROLE_ADMIN");
    }

    private Authentication jwtAuth(String sub, String role) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", sub)
                .build();
        return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private User buildUser(Long id, String email, Set<Role> roles) {
        User user = new User(email, "hash");
        ReflectionTestUtils.setField(user, "id", id);
        user.setFullName("Test User");
        user.setRoles(roles);
        return user;
    }
}