package org.kunlecreates.user.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kunlecreates.user.application.EmailVerificationService;
import org.kunlecreates.user.domain.EmailVerificationToken;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.repository.EmailVerificationTokenRepository;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private JwtService jwtService;

    private EmailVerificationService emailVerificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        emailVerificationService = new EmailVerificationService(
            tokenRepository,
            userRepository,
            passwordEncoder,
            restTemplate,
            jwtService
        );

        // Set properties via reflection
        ReflectionTestUtils.setField(emailVerificationService, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(emailVerificationService, "notificationServiceUrl", "http://notification:8080");
        ReflectionTestUtils.setField(emailVerificationService, "testMode", true); // Enable test mode

        testUser = new User("test@example.com", "hashedPassword");
        ReflectionTestUtils.setField(testUser, "id", 1L);
    }

    @Test
    void createVerificationToken_shouldGenerateUuidAndHashItWithBcrypt() {
        when(passwordEncoder.encode(anyString())).thenReturn("bcrypt-hash");

        String token = emailVerificationService.createVerificationToken(testUser);

        assertThat(token).isNotNull();
        assertThat(token).hasSize(36); // UUID format
        verify(passwordEncoder).encode(token);
        
        ArgumentCaptor<EmailVerificationToken> tokenCaptor = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        
        EmailVerificationToken savedToken = tokenCaptor.getValue();
        assertThat(savedToken.getTokenHash()).isEqualTo("bcrypt-hash");
        assertThat(savedToken.getUser()).isEqualTo(testUser);
        assertThat(savedToken.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void sendVerificationEmail_inTestMode_shouldSkipEmailSending() {
        String rawToken = "test-token";

        emailVerificationService.sendVerificationEmail(testUser, rawToken);

        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
        verify(jwtService, never()).generateToken(anyString(), anyString(), anyList());
    }

    @Test
    void sendVerificationEmail_inProductionMode_shouldCallNotificationService() {
        ReflectionTestUtils.setField(emailVerificationService, "testMode", false);
        String rawToken = "test-token";
        
        when(jwtService.generateToken(anyString(), anyString(), anyList())).thenReturn("service-jwt");

        emailVerificationService.sendVerificationEmail(testUser, rawToken);

        verify(jwtService).generateToken("system", "user-service", List.of("SERVICE"));
        verify(restTemplate).postForEntity(
            eq("http://notification:8080/api/notification/email"),
            any(),
            eq(String.class)
        );
    }

    @Test
    void verifyEmail_withValidToken_shouldActivateUserAndMarkTokenUsed() {
        String rawToken = "valid-token";
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token-hash", Instant.now().plusSeconds(3600));
        
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findAll()).thenReturn(List.of(token));
        when(passwordEncoder.matches(rawToken, "token-hash")).thenReturn(true);

        boolean result = emailVerificationService.verifyEmail("test@example.com", rawToken);

        assertThat(result).isTrue();
        assertThat(testUser.getEmailVerified()).isEqualTo(1);
        assertThat(testUser.getIsActive()).isEqualTo(1);
        assertThat(token.getUsedAt()).isNotNull();
        verify(tokenRepository).save(token);
        verify(userRepository).save(testUser);
    }

    @Test
    void verifyEmail_withInvalidToken_shouldReturnFalse() {
        String rawToken = "invalid-token";
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token-hash", Instant.now().plusSeconds(3600));
        
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findAll()).thenReturn(List.of(token));
        when(passwordEncoder.matches(rawToken, "token-hash")).thenReturn(false);

        boolean result = emailVerificationService.verifyEmail("test@example.com", rawToken);

        assertThat(result).isFalse();
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyEmail_withExpiredToken_shouldReturnFalse() {
        String rawToken = "expired-token";
        EmailVerificationToken token = new EmailVerificationToken(testUser, "token-hash", Instant.now().minusSeconds(3600));
        
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findAll()).thenReturn(List.of(token));

        boolean result = emailVerificationService.verifyEmail("test@example.com", rawToken);

        assertThat(result).isFalse();
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void verifyEmail_whenUserNotFound_shouldThrowException() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> emailVerificationService.verifyEmail("nonexistent@example.com", "token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User not found");
    }

    @Test
    void resendVerificationEmail_shouldCreateNewTokenAndSendEmail() {
        EmailVerificationToken oldToken = new EmailVerificationToken(testUser, "old-hash", Instant.now().plusSeconds(1800));
        
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findAll()).thenReturn(List.of(oldToken));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");

        emailVerificationService.resendVerificationEmail("test@example.com");

        verify(tokenRepository).delete(oldToken);
        verify(tokenRepository).save(any(EmailVerificationToken.class));
        // Email sending verification omitted as test mode is enabled
    }
}
