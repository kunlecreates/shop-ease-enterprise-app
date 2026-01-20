package org.kunlecreates.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity(debug = true)  // Enable debug mode to see detailed filter chain logs
//@EnableMethodSecurity  // TEMPORARILY DISABLED to test if this is causing 403
public class SecurityConfig {

    /**
     * Single filter chain with permitAll for public endpoints.
     * NO OAuth2 Resource Server configuration to avoid Bearer challenges.
     * 
     * Public endpoints (/actuator/**, /api/user/register, /api/user/login, /api/auth/**) 
     * are allowed without authentication.
     * 
     * All other endpoints require authentication (will return 403 until JWT filter is added).
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/user/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/user/login").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .anonymous(anonymous -> anonymous.authorities("ROLE_ANONYMOUS"))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
