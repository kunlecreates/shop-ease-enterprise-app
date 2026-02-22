package org.kunlecreates.user.application;

import org.kunlecreates.user.domain.EmailVerificationToken;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.repository.EmailVerificationTokenRepository;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;
    private final JwtService jwtService;
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    @Value("${app.notification.url}")
    private String notificationServiceUrl;
    
    @Value("${app.verification.test-mode:false}")
    private boolean testMode;

    public EmailVerificationService(
        EmailVerificationTokenRepository tokenRepository,
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        RestTemplate restTemplate,
        JwtService jwtService
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
        this.jwtService = jwtService;
    }

    @Transactional
    public String createVerificationToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = passwordEncoder.encode(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        
        EmailVerificationToken token = new EmailVerificationToken(user, tokenHash, expiresAt);
        tokenRepository.save(token);
        
        return rawToken;
    }

    @Transactional
    public void sendVerificationEmail(User user, String rawToken) {
        // Auto-verify test users based on email pattern OR global test mode
        boolean isTestUser = isTestEmail(user.getEmail());
        
        if (testMode || isTestUser) {
            log.info("Auto-verifying user (testMode={}, isTestUser={}): {}", testMode, isTestUser, user.getEmail());
            user.setEmailVerified(1);
            user.setIsActive(1);
            userRepository.save(user);
            userRepository.flush(); // Force immediate write to database
            return;
        }
        
        String verificationUrl = frontendUrl + "/verify-email?token=" + rawToken + "&email=" + user.getEmail();
        
        try {
            // Generate service-to-service JWT token for notification service
            String serviceToken = jwtService.generateToken(
                "system",
                "user-service",
                List.of("SERVICE"),
                "System",
                "Service"
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + serviceToken);
            
            Map<String, Object> emailRequest = Map.of(
                "to", user.getEmail(),
                "subject", "Verify Your ShopEase Account",
                "body", buildVerificationEmailBody(verificationUrl)
            );
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailRequest, headers);
            String url = notificationServiceUrl + "/api/notification/email";
            
            log.info("Sending verification email to {} via {}", user.getEmail(), url);
            restTemplate.postForEntity(url, request, String.class);
            log.info("Verification email sent successfully to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    @Transactional
    public boolean verifyEmail(String email, String rawToken) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        var tokens = tokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .filter(t -> t.getUsedAt() == null)
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .toList();
        
        for (EmailVerificationToken token : tokens) {
            if (passwordEncoder.matches(rawToken, token.getTokenHash())) {
                token.markUsed(LocalDateTime.now());
                tokenRepository.save(token);
                
                user.setEmailVerified(1);
                user.setIsActive(1);
                userRepository.save(user);
                
                // Send welcome email after successful verification
                sendWelcomeEmail(user);
                
                return true;
            }
        }
        
        return false;
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (user.getEmailVerified() == 1) {
            throw new IllegalStateException("Email already verified");
        }
        
        // Create new token and send email
        String rawToken = createVerificationToken(user);
        sendVerificationEmail(user, rawToken);
    }

    /**
     * Check if an email belongs to a test user that should be auto-verified.
     * Test patterns: *@example.com, *@test.local, emails containing 'test'
     */
    private boolean isTestEmail(String email) {
        if (email == null) {
            return false;
        }
        String lowerEmail = email.toLowerCase();
        return lowerEmail.endsWith("@example.com")
            || lowerEmail.endsWith("@test.local")
            || lowerEmail.contains("test");
    }

    private String buildVerificationEmailBody(String verificationUrl) {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px;">
                        <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to ShopEase!</h1>
                        <p>Thank you for registering with ShopEase. Please verify your email address to activate your account.</p>
                        <p>Click the button below to verify your email:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" 
                               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block; 
                                      font-weight: bold;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                        <p style="color: #2563eb; word-break: break-all; font-size: 12px;">%s</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                            This link will expire in 24 hours. If you didn't create an account with ShopEase, please ignore this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """, verificationUrl, verificationUrl);
    }
    
    /**
     * Send welcome email after successful email verification
     */
    private void sendWelcomeEmail(User user) {
        try {
            // Generate service-to-service JWT token for notification service
            String serviceToken = jwtService.generateToken(
                "system",
                "user-service",
                List.of("SERVICE"),
                "System Service"
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + serviceToken);
            
            String username = user.getEmail().split("@")[0];
            
            Map<String, Object> welcomeRequest = Map.of(
                "email", user.getEmail(),
                "username", username
            );
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(welcomeRequest, headers);
            String url = notificationServiceUrl + "/api/notification/welcome";
            
            log.info("Sending welcome email to {} via {}", user.getEmail(), url);
            restTemplate.postForEntity(url, request, String.class);
            log.info("Welcome email sent successfully to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }
}
