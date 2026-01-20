package org.kunlecreates.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * Public endpoints filter chain - NO authentication required.
     * Order(1) ensures this is checked FIRST before protected chain.
     * 
     * This chain handles ALL public endpoints without ANY authentication filters.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/actuator/**", "/api/user/register", "/api/user/login", "/api/auth/**")
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().permitAll()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }

    /**
     * Protected endpoints filter chain - Requires authentication via custom filter.
     * Order(2) ensures this is checked AFTER public chain.
     * 
     * For now, this just requires authentication without specifying the mechanism.
     * JWT authentication will be handled by a custom authentication filter.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain protectedFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
