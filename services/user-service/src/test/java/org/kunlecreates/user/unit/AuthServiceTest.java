package org.kunlecreates.user.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.kunlecreates.user.application.AuthService;
import org.kunlecreates.user.application.EmailVerificationService;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.domain.Role;
import org.kunlecreates.user.domain.PasswordResetToken;
import org.kunlecreates.user.domain.exception.DuplicateUserException;
import org.kunlecreates.user.domain.exception.PasswordResetRequiredException;
import org.kunlecreates.user.domain.exception.PasswordResetTokenException;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.repository.RoleRepository;
import org.kunlecreates.user.repository.PasswordResetTokenRepository;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        testUser = new User("test@example.com", "hashedPassword");
        ReflectionTestUtils.setField(testUser, "id", 1L);
        
        customerRole = new Role("customer");
        ReflectionTestUtils.setField(customerRole, "id", 1L);
    }

    @Test
    void register_whenUserAlreadyExists_shouldThrowDuplicateUserException() {
        CreateUserRequest request = new CreateUserRequest("existing@example.com", "password123");
        when(userRepository.findByEmail("existing@example.com"))
                .thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateUserException.class)
                .hasMessage("User already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldEncodePasswordBeforeSaving() {
        CreateUserRequest request = new CreateUserRequest("new@example.com", "rawPassword");
        User savedUser = new User("new@example.com", "hashedPassword");
        ReflectionTestUtils.setField(savedUser, "id", 2L);
                savedUser.setIsActive(0);
                savedUser.setEmailVerified(0);

        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("rawPassword")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));
        when(emailVerificationService.createVerificationToken(any(User.class))).thenReturn("mock-token");
                when(userRepository.findById(2L)).thenReturn(Optional.of(savedUser));

        authService.register(request);

        verify(passwordEncoder).encode("rawPassword");
        verify(userRepository, times(2)).save(any(User.class));
        verify(emailVerificationService).createVerificationToken(any(User.class));
        verify(emailVerificationService).sendVerificationEmail(any(User.class), eq("mock-token"));
    }

    @Test
    void register_shouldAddCustomerRoleToNewUser() {
        CreateUserRequest request = new CreateUserRequest("new@example.com", "password");
        User savedUser = new User("new@example.com", "hashedPassword");
        ReflectionTestUtils.setField(savedUser, "id", 2L);
                savedUser.setIsActive(0);
                savedUser.setEmailVerified(0);

        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));
                when(emailVerificationService.createVerificationToken(any(User.class))).thenReturn("mock-token");
                when(userRepository.findById(2L)).thenReturn(Optional.of(savedUser));

        authService.register(request);

        verify(roleRepository).findByNameIgnoreCase("customer");
        assertThat(savedUser.getRoles()).contains(customerRole);
    }

    @Test
    void register_whenCustomerRoleNotFound_shouldThrowException() {
        CreateUserRequest request = new CreateUserRequest("new@example.com", "password");
        User savedUser = new User("new@example.com", "hashedPassword");

        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Customer role not found");
    }

    @Test
    void register_shouldGenerateJwtTokenWithCorrectDetails() {
        CreateUserRequest request = new CreateUserRequest("new@example.com", "password");
        User savedUser = new User("new@example.com", "hashedPassword");
        ReflectionTestUtils.setField(savedUser, "id", 5L);

                User reloadedUser = new User("new@example.com", "hashedPassword");
                ReflectionTestUtils.setField(reloadedUser, "id", 5L);
                reloadedUser.getRoles().add(customerRole);
                reloadedUser.setIsActive(1);
                reloadedUser.setEmailVerified(1);

        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));
                when(emailVerificationService.createVerificationToken(any(User.class))).thenReturn("mock-token");
                when(userRepository.findById(5L)).thenReturn(Optional.of(reloadedUser));
        when(jwtService.generateToken("5", "new@example.com", List.of("CUSTOMER"), null))
                .thenReturn("generated-token");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("generated-token");
        assertThat(response.userId()).isEqualTo("5");
        assertThat(response.email()).isEqualTo("new@example.com");
        verify(jwtService).generateToken("5", "new@example.com", List.of("CUSTOMER"), null);
    }

    @Test
    void register_whenVerificationTokenGenerationFails_shouldPropagateAndSkipEmailSend() {
        CreateUserRequest request = new CreateUserRequest("verifyfail@example.com", "password");
        User savedUser = new User("verifyfail@example.com", "hashedPassword");
        ReflectionTestUtils.setField(savedUser, "id", 8L);

        when(userRepository.findByEmail("verifyfail@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));
        when(emailVerificationService.createVerificationToken(savedUser))
                .thenThrow(new RuntimeException("verification token failure"));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("verification token failure");

        verify(emailVerificationService, never()).sendVerificationEmail(any(User.class), anyString());
        verify(userRepository, never()).findById(anyLong());
        verify(jwtService, never()).generateToken(anyString(), anyString(), anyList(), any());
    }

    @Test
    void register_whenRoleAssignmentSaveFails_shouldPropagateAndSkipVerificationFlow() {
        CreateUserRequest request = new CreateUserRequest("rolesavefail@example.com", "password");
        User firstSavedUser = new User("rolesavefail@example.com", "hashedPassword");
        ReflectionTestUtils.setField(firstSavedUser, "id", 9L);

        when(userRepository.findByEmail("rolesavefail@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class)))
                .thenReturn(firstSavedUser)
                .thenThrow(new RuntimeException("role save failed"));
        when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("role save failed");

        verify(emailVerificationService, never()).createVerificationToken(any(User.class));
        verify(emailVerificationService, never()).sendVerificationEmail(any(User.class), anyString());
    }

        @Test
        void register_whenReloadedUserIsInactive_shouldReturnNullTokenAndSkipJwtGeneration() {
                CreateUserRequest request = new CreateUserRequest("pending@example.com", "password");
                User savedUser = new User("pending@example.com", "hashedPassword");
                ReflectionTestUtils.setField(savedUser, "id", 6L);
                savedUser.getRoles().add(customerRole);
                savedUser.setIsActive(0);
                savedUser.setEmailVerified(0);

                when(userRepository.findByEmail("pending@example.com")).thenReturn(Optional.empty());
                when(passwordEncoder.encode("password")).thenReturn("hashedPassword");
                when(userRepository.save(any(User.class))).thenReturn(savedUser);
                when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));
                when(emailVerificationService.createVerificationToken(any(User.class))).thenReturn("verify-token");
                when(userRepository.findById(6L)).thenReturn(Optional.of(savedUser));

                AuthResponse response = authService.register(request);

                assertThat(response.token()).isNull();
                assertThat(response.userId()).isEqualTo("6");
                verify(jwtService, never()).generateToken(anyString(), anyString(), anyList(), any());
                verify(emailVerificationService).sendVerificationEmail(savedUser, "verify-token");
        }

        @Test
        void register_whenReloadedUserIsAutoVerified_shouldGenerateJwtFromReloadedUser() {
                CreateUserRequest request = new CreateUserRequest("autoverified@example.com", "password");
                User savedUser = new User("autoverified@example.com", "hashedPassword");
                ReflectionTestUtils.setField(savedUser, "id", 7L);

                User reloadedUser = new User("autoverified@example.com", "hashedPassword");
                ReflectionTestUtils.setField(reloadedUser, "id", 7L);
                reloadedUser.getRoles().add(customerRole);
                reloadedUser.setIsActive(1);
                reloadedUser.setEmailVerified(1);

                when(userRepository.findByEmail("autoverified@example.com")).thenReturn(Optional.empty());
                when(passwordEncoder.encode("password")).thenReturn("hashedPassword");
                when(userRepository.save(any(User.class))).thenReturn(savedUser, reloadedUser);
                when(roleRepository.findByNameIgnoreCase("customer")).thenReturn(Optional.of(customerRole));
                when(emailVerificationService.createVerificationToken(any(User.class))).thenReturn("verify-token");
                when(userRepository.findById(7L)).thenReturn(Optional.of(reloadedUser));
                when(jwtService.generateToken("7", "autoverified@example.com", List.of("CUSTOMER"), null))
                                .thenReturn("auto-jwt-token");

                AuthResponse response = authService.register(request);

                assertThat(response.token()).isEqualTo("auto-jwt-token");
                verify(jwtService).generateToken("7", "autoverified@example.com", List.of("CUSTOMER"), null);
        }

    @Test
    void login_whenUserNotFound_shouldThrowException() {
        LoginRequest request = new LoginRequest("nonexistent@example.com", "password");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void login_whenPasswordDoesNotMatch_shouldThrowException() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongPassword");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void login_whenUnusedPasswordResetTokenExists_shouldThrowPasswordResetRequiredException() {
        LoginRequest request = new LoginRequest("test@example.com", "correctPassword");
                testUser.setEmailVerified(1);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword", "hashedPassword")).thenReturn(true);
        when(passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(
                eq(testUser), any(LocalDateTime.class))).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(PasswordResetRequiredException.class)
                .hasMessage("Password reset required");
    }

    @Test
    void login_withValidCredentials_shouldGenerateTokenAndReturnAuthResponse() {
        testUser.getRoles().add(customerRole);
                testUser.setEmailVerified(1);
        LoginRequest request = new LoginRequest("test@example.com", "correctPassword");
        
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword", "hashedPassword")).thenReturn(true);
        when(passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(
                eq(testUser), any(LocalDateTime.class))).thenReturn(false);
        when(jwtService.generateToken("1", "test@example.com", List.of("CUSTOMER"), null))
                .thenReturn("login-token");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("login-token");
        assertThat(response.userId()).isEqualTo("1");
        assertThat(response.email()).isEqualTo("test@example.com");
    }

        @Test
        void login_whenUserHasNoRoles_shouldDefaultResponseRoleToCustomer() {
                testUser.setEmailVerified(1);
                LoginRequest request = new LoginRequest("test@example.com", "correctPassword");

                when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
                when(passwordEncoder.matches("correctPassword", "hashedPassword")).thenReturn(true);
                when(passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(
                                eq(testUser), any(LocalDateTime.class))).thenReturn(false);
                when(jwtService.generateToken("1", "test@example.com", List.of(), null))
                                .thenReturn("login-token");

                AuthResponse response = authService.login(request);

                assertThat(response.user().role()).isEqualTo("CUSTOMER");
        }

    @Test
    void initiatePasswordReset_whenUserNotFound_shouldThrowException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.initiatePasswordReset("unknown@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");
    }

    @Test
    void initiatePasswordReset_whenActiveTokenExists_shouldThrowPasswordResetTokenException() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(
                eq(testUser), any(LocalDateTime.class))).thenReturn(true);

        assertThatThrownBy(() -> authService.initiatePasswordReset("test@example.com"))
                .isInstanceOf(PasswordResetTokenException.class)
                .hasMessage("Active reset token already exists");
    }

    @Test
    void initiatePasswordReset_shouldGenerateUuidTokenAndStoreBcryptHash() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(
                eq(testUser), any(LocalDateTime.class))).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("bcrypt-hash-of-token");

        String token = authService.initiatePasswordReset("test@example.com");

        assertThat(token).isNotNull();
        assertThat(token).hasSize(36); // UUID format
        verify(passwordEncoder).encode(token);
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

        @Test
        void initiatePasswordReset_whenPasswordEncodingFails_shouldPropagateAndSkipTokenSave() {
                when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
                when(passwordResetTokenRepository.existsByUserAndUsedAtIsNullAndExpiresAtAfter(
                                eq(testUser), any(LocalDateTime.class))).thenReturn(false);
                when(passwordEncoder.encode(anyString())).thenThrow(new RuntimeException("bcrypt failure"));

                assertThatThrownBy(() -> authService.initiatePasswordReset("test@example.com"))
                                .isInstanceOf(RuntimeException.class)
                                .hasMessage("bcrypt failure");

                verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
        }

    @Test
    void confirmPasswordReset_whenNoMatchingToken_shouldThrowException() {
        when(passwordResetTokenRepository.findByUsedAtIsNullAndExpiresAtAfter(any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> authService.confirmPasswordReset("invalid-token", "newPassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid or expired token");
    }

    @Test
    void confirmPasswordReset_withValidToken_shouldUpdatePasswordAndMarkTokenUsed() {
        PasswordResetToken resetToken = new PasswordResetToken(
                testUser, "bcrypt-hash", LocalDateTime.now().plusSeconds(3600));
        
        when(passwordResetTokenRepository.findByUsedAtIsNullAndExpiresAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(resetToken));
        when(passwordEncoder.matches("plain-token", "bcrypt-hash")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hashed-password");

        boolean result = authService.confirmPasswordReset("plain-token", "newPassword123");

        assertThat(result).isTrue();
        verify(passwordEncoder).encode("newPassword123");
        verify(userRepository).save(testUser);
        verify(passwordResetTokenRepository).save(resetToken);
    }

    @Test
    void confirmPasswordReset_whenMultipleTokensExist_shouldUseOnlyMatchingToken() {
        PasswordResetToken nonMatchingToken = new PasswordResetToken(
                testUser, "other-hash", LocalDateTime.now().plusSeconds(3600));
        PasswordResetToken matchingToken = new PasswordResetToken(
                testUser, "matching-hash", LocalDateTime.now().plusSeconds(3600));

        when(passwordResetTokenRepository.findByUsedAtIsNullAndExpiresAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(nonMatchingToken, matchingToken));
        when(passwordEncoder.matches("plain-token", "other-hash")).thenReturn(false);
        when(passwordEncoder.matches("plain-token", "matching-hash")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hashed-password");

        boolean result = authService.confirmPasswordReset("plain-token", "newPassword123");

        assertThat(result).isTrue();
        verify(userRepository).save(testUser);
        verify(passwordResetTokenRepository).save(matchingToken);
        verify(passwordResetTokenRepository, never()).save(nonMatchingToken);
    }

    @Test
    void confirmPasswordReset_whenUserSaveFails_shouldPropagateAndSkipTokenSave() {
        PasswordResetToken resetToken = new PasswordResetToken(
                testUser, "bcrypt-hash", LocalDateTime.now().plusSeconds(3600));

        when(passwordResetTokenRepository.findByUsedAtIsNullAndExpiresAtAfter(any(LocalDateTime.class)))
                .thenReturn(List.of(resetToken));
        when(passwordEncoder.matches("plain-token", "bcrypt-hash")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hashed-password");
        when(userRepository.save(testUser)).thenThrow(new RuntimeException("user save failed"));

        assertThatThrownBy(() -> authService.confirmPasswordReset("plain-token", "newPassword123"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("user save failed");

        verify(passwordResetTokenRepository, never()).save(resetToken);
    }

    @Test
    void login_whenEmailNotVerified_shouldThrowIllegalStateException() {
        testUser.setEmailVerified(0);
        LoginRequest request = new LoginRequest("test@example.com", "correctPassword");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword", testUser.getPasswordHash())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Email not verified. Please check your email for verification link.");

        verify(jwtService, never()).generateToken(any(), any(), any(), any());
    }
}
