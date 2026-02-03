package org.kunlecreates.user.application;

import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.domain.PasswordResetToken;
import org.kunlecreates.user.domain.exception.DuplicateUserException;
import org.kunlecreates.user.domain.exception.PasswordResetRequiredException;
import org.kunlecreates.user.domain.exception.PasswordResetTokenException;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.repository.PasswordResetTokenRepository;
import org.kunlecreates.user.repository.RoleRepository;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationService emailVerificationService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        PasswordResetTokenRepository passwordResetTokenRepository,
        EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationService = emailVerificationService;
    }

    @Transactional
    public AuthResponse register(CreateUserRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new DuplicateUserException("User already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.email(), hashedPassword);
        
        // Set user as inactive until email is verified
        user.setIsActive(0);
        user.setEmailVerified(0);
        user = userRepository.save(user);

        var customerRole = roleRepository.findByNameIgnoreCase("customer")
                .orElseThrow(() -> new IllegalStateException("Customer role not found"));
        user.getRoles().add(customerRole);
        user = userRepository.save(user);

        // Create and send verification token
        String verificationToken = emailVerificationService.createVerificationToken(user);
        emailVerificationService.sendVerificationEmail(user, verificationToken);

        // Reload user to check if auto-verified (test mode)
        user = userRepository.findById(user.getId()).orElseThrow();
        
        // Generate JWT token if user is now active (test mode auto-verification)
        String jwtToken = null;
        if (user.getIsActive() == 1) {
            List<String> roleList = user.getRoles().stream()
                .map(role -> role.getName().toUpperCase())
                .toList();
            jwtToken = jwtService.generateToken(
                String.valueOf(user.getId()),
                user.getEmail(),
                roleList
            );
        }
        
        // Return response without JWT token - user must verify email first
        String primaryRole = "CUSTOMER";
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
            String.valueOf(user.getId()),
            user.getEmail().split("@")[0],
            user.getEmail(),
            primaryRole
        );

        // Return token if user is active, otherwise null to indicate verification required
        return new AuthResponse(jwtToken, String.valueOf(user.getId()), user.getEmail(), userInfo);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        // Check if email is verified
        if (user.getEmailVerified() == 0) {
            throw new IllegalStateException("Email not verified. Please check your email for verification link.");
        }

        // Enforce password reset if there exists an unused, unexpired password reset token
        if (passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(user, LocalDateTime.now())) {
            throw new PasswordResetRequiredException("Password reset required");
        }

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().toUpperCase())
                .collect(Collectors.toList());

        String token = jwtService.generateToken(
            String.valueOf(user.getId()),
            user.getEmail(),
            roles
        );

        String primaryRole = roles.isEmpty() ? "CUSTOMER" : roles.get(0);
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
            String.valueOf(user.getId()),
            user.getEmail().split("@")[0],
            user.getEmail(),
            primaryRole
        );

        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail(), userInfo);
    }

    @Transactional
    public String initiatePasswordReset(String email) {        

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (passwordResetTokenRepository
                .existsByUserAndUsedAtIsNullAndExpiresAtAfter(user, LocalDateTime.now())) {
            throw new PasswordResetTokenException("Active reset token already exists");
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(24 * 3600);

        // Store a bcrypt hash of the token in DB for lookup (matches seed format)
        String tokenHash = passwordEncoder.encode(token);
        PasswordResetToken prt = new PasswordResetToken(user, tokenHash, expiresAt);
        passwordResetTokenRepository.save(prt);
        return token;
    }

    @Transactional
    public boolean confirmPasswordReset(String token, String newPassword) {
        LocalDateTime now = LocalDateTime.now();
        // Look up all unused tokens and compare using BCrypt matches
        List<PasswordResetToken> candidates = 
                passwordResetTokenRepository.findByUsedAtIsNullAndExpiresAtAfter(now);

        PasswordResetToken matched = null;
        
        for (PasswordResetToken prt : candidates) {
            if (passwordEncoder.matches(token, prt.getTokenHash())) {
                matched = prt;
                break;
            }
        }

        if (matched == null) throw new IllegalArgumentException("Invalid or expired token");

        User user = matched.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        matched.markUsed(now);
        passwordResetTokenRepository.save(matched);
        return true;
    }
}
