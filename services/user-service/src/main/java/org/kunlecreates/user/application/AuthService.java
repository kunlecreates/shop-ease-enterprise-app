package org.kunlecreates.user.application;

import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.domain.exception.DuplicateUserException;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.repository.RoleRepository;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    // Simple in-memory token store (for production, use Redis or database)
    private final Map<String, PasswordResetToken> resetTokens = new HashMap<>();

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    private static class PasswordResetToken {
        String email;
        LocalDateTime expiresAt;
        
        PasswordResetToken(String email, LocalDateTime expiresAt) {
            this.email = email;
            this.expiresAt = expiresAt;
        }
    }

    @Transactional
    public AuthResponse register(CreateUserRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new DuplicateUserException("User already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.email(), hashedPassword);
        user = userRepository.save(user);

        var customerRole = roleRepository.findByNameIgnoreCase("customer")
                .orElseThrow(() -> new IllegalStateException("Customer role not found"));
        user.getRoles().add(customerRole);
        userRepository.save(user);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().toUpperCase())
                .collect(Collectors.toList());

        String token = jwtService.generateToken(
            String.valueOf(user.getId()),
            user.getEmail(),
            roles
        );

        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().toUpperCase())
                .collect(Collectors.toList());

        String token = jwtService.generateToken(
            String.valueOf(user.getId()),
            user.getEmail(),
            roles
        );

        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail());
    }

    @Transactional
    public String initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        
        resetTokens.put(token, new PasswordResetToken(email, expiresAt));
        
        return token;
    }

    @Transactional
    public boolean confirmPasswordReset(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokens.get(token);
        
        if (resetToken == null) {
            throw new IllegalArgumentException("Invalid or expired token");
        }
        
        if (LocalDateTime.now().isAfter(resetToken.expiresAt)) {
            resetTokens.remove(token);
            throw new IllegalArgumentException("Token has expired");
        }
        
        User user = userRepository.findByEmail(resetToken.email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);
        
        resetTokens.remove(token);
        
        return true;
    }
}
