package org.kunlecreates.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
     * Single security filter chain that handles both public and protected endpoints.
     * 
     * KEY INSIGHT: When using OAuth2 Resource Server with public endpoints, you CANNOT
     * use multiple filter chains where one has oauth2ResourceServer() configured.
     * 
     * The solution is a SINGLE chain where:
     * 1. Public endpoints are declared with permitAll() BEFORE authenticated()
     * 2. oauth2ResourceServer() is configured to apply JWT validation only when needed
     * 3. The order matters: requestMatchers with permitAll() must come FIRST
     * 
     * This approach ensures that:
     * - Public endpoints bypass JWT validation entirely (no 401 with WWW-Authenticate: Bearer)
     * - Protected endpoints require valid JWT tokens
     * - Spring Security correctly routes requests based on authorization rules, not filter chains
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints: Allow without authentication
                .requestMatchers(
                    "/actuator/**",
                    "/api/user/register",
                    "/api/user/login",
                    "/api/auth/**"
                ).permitAll()
                // All other endpoints: Require authentication
                .anyRequest().authenticated()
            )
            // Configure OAuth2 Resource Server with JWT
            // This ONLY applies to requests that require authentication (not permitAll)
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
