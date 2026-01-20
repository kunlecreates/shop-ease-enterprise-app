package org.kunlecreates.user.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * Custom BearerTokenResolver that returns null for public endpoints.
     * This prevents BearerTokenAuthenticationFilter from attempting authentication
     * on public paths, thereby avoiding 401 with Bearer challenge.
     */
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
        
        return request -> {
            String path = request.getRequestURI();
            
            // Skip Bearer token resolution for public endpoints
            if (isPublicEndpoint(path)) {
                return null;
            }
            
            // For protected endpoints, use standard Bearer token resolution
            return defaultResolver.resolve(request);
        };
    }
    
    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/actuator/") ||
               path.equals("/api/user/register") ||
               path.equals("/api/user/login") ||
               path.startsWith("/api/auth/");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/actuator/**", "/api/user/register", "/api/user/login", "/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(bearerTokenResolver())
                .jwt(Customizer.withDefaults())
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
