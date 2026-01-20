package org.kunlecreates.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity  // Enable @PreAuthorize, @PostAuthorize, @Secured annotations
public class SecurityConfig {

    /**
     * Security filter chain for PUBLIC endpoints (no authentication required).
     * This chain does NOT configure OAuth2 Resource Server, allowing unauthenticated access.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/actuator/health/**", "/actuator/health", "/actuator/info",
                           "/api/auth/login", "/api/auth/register",
                           "/api/user/register", "/api/user/login")  // Allow both /api/auth and /api/user paths
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);
        // NOTE: NO .oauth2ResourceServer() here - that's the key!

        return http.build();
    }

    /**
     * Security filter chain for PROTECTED endpoints (JWT authentication required).
     * This chain automatically handles all requests NOT matched by the first chain.
     * Per Spring Security docs: Do NOT use securityMatcher("/**") - the default RequestMatcher
     * matches any request not matched by higher-priority chains.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain protectedFilterChain(HttpSecurity http) throws Exception {
        http
            // NO securityMatcher needed - will match everything not matched by Order(1)
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
