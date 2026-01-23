package org.kunlecreates.user.interfaces;

import jakarta.validation.Valid;
import org.kunlecreates.user.application.AuthService;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.kunlecreates.user.interfaces.dto.UpdateProfileRequest;
import org.kunlecreates.user.interfaces.dto.UpdateRoleRequest;
import org.kunlecreates.user.interfaces.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /**
     * PRD FR003: Only ADMIN role can list all users
     * GDPR Compliance: Data minimization - regular users cannot access all user data
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<UserResponse> list() {
        return userService.listUsers().stream()
                .map(UserResponse::from)
                .toList();
    }

    /**
     * PRD FR002: Profile Management with ownership validation
     * Users can view their own profile, admins can view any profile
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> get(@PathVariable Long id, Authentication authentication) {
        Long currentUserId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        
        // Users can only access their own profile unless they are admin
        if (!currentUserId.equals(id) && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return userService.findById(id)
                .map(UserResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PRD FR002: Get authenticated user's own profile
     * Convenience endpoint for current user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        Long userId = extractUserIdFromAuth(authentication);
        return userService.findById(userId)
                .map(UserResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Alias for /profile - used by API tests
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(Authentication authentication) {
        return getProfile(authentication);
    }

    /**
     * Public registration endpoint (alias for /api/auth/register)
     * This allows tests to use /api/user/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody CreateUserRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Public login endpoint (alias for /api/auth/login)
     * This allows tests to use /api/user/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * PRD FR003: Only ADMIN can create users directly
     * Regular user registration should use /api/auth/register or /api/user/register instead
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> create(@Valid @RequestBody CreateUserRequest req, UriComponentsBuilder uriBuilder) {
        User created = userService.createUser(req.email(), req.password());
        URI location = uriBuilder.path("/api/user/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).build();
    }

    /**
     * Logout endpoint - invalidates JWT token
     * Note: JWT tokens are stateless, so we return 200 to indicate success
     * Client should remove the token from storage
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT tokens are stateless, client handles token removal
        return ResponseEntity.ok().build();
    }

    /**
     * Update user profile
     * Users can update their own profile
     */
    @PatchMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        Long userId = extractUserIdFromAuth(authentication);
        
        try {
            return userService.updateProfile(userId, request.firstName(), request.lastName(), 
                                           request.email())
                    .map(UserResponse::from)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete user account
     * Users can delete their own account, admins can delete any account
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        Long currentUserId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        
        // Users can only delete their own account unless they are admin
        if (!currentUserId.equals(id) && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        boolean deleted = userService.deleteUser(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    /**
     * Update user role - admin only
     */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        try {
            return userService.updateUserRole(id, request.role())
                    .map(UserResponse::from)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get user role
     */
    @GetMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> getRole(
            @PathVariable Long id, 
            Authentication authentication) {
        Long currentUserId = extractUserIdFromAuth(authentication);
        boolean isAdmin = hasRole(authentication, "ADMIN");
        
        // Users can view their own role, admins can view any role
        if (!currentUserId.equals(id) && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return userService.findById(id)
                .map(user -> {
                    Map<String, Object> response = new HashMap<>();
                    if (!user.getRoles().isEmpty()) {
                        String roleName = user.getRoles().iterator().next().getName();
                        response.put("role", roleName.toUpperCase());
                        response.put("userId", user.getId().toString());
                    }
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Extract user ID from JWT token or test authentication
     * Supports both JWT (production) and String username (test with @WithMockUser)
     */
    private Long extractUserIdFromAuth(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getClaimAsString("sub");
            return Long.parseLong(sub);
        } else if (authentication.getPrincipal() instanceof String username) {
            // For tests using @WithMockUser, username is the user ID
            return Long.parseLong(username);
        } else if (authentication.getName() != null) {
            // For @WithMockUser, getName() returns the username
            return Long.parseLong(authentication.getName());
        }
        throw new IllegalStateException("Invalid authentication principal: " + authentication.getPrincipal().getClass());
    }

    /**
     * Check if user has specific role (case-insensitive)
     */
    private boolean hasRole(Authentication authentication, String role) {
        String targetRole = ("ROLE_" + role).toUpperCase();
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().toUpperCase().equals(targetRole));
    }
}
