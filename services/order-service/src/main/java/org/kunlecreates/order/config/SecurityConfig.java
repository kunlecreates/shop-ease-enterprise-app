package org.kunlecreates.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

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
            .securityMatcher("/actuator/health/**", "/actuator/health", "/actuator/info")
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable());
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
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    /**
     * Configure JWT authentication converter to extract roles from JWT claims
     * and map them to Spring Security authorities.
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new JwtGrantedAuthoritiesConverter());
        return converter;
    }

    /**
     * Custom converter to extract roles from JWT "roles" claim
     * and convert them to GrantedAuthority objects.
     * 
     * Example JWT payload:
     * {
     *   "sub": "user123",
     *   "email": "user@example.com",
     *   "roles": ["ROLE_USER", "ROLE_ADMIN"]
     * }
     */
    static class JwtGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            List<String> roles = jwt.getClaimAsStringList("roles");
            if (roles == null || roles.isEmpty()) {
                return List.of();
            }
            return roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }
    }
}
