package org.kunlecreates.user.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Filter that pre-authenticates requests to public endpoints with anonymous authentication.
 * This prevents BearerTokenAuthenticationFilter from requiring Bearer tokens on public paths.
 */
public class PublicEndpointFilter extends OncePerRequestFilter {

    private final List<String> publicPaths = Arrays.asList(
        "/actuator/**",
        "/api/user/register",
        "/api/user/login",
        "/api/auth/**"
    );
    
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Check if this is a public path
        boolean isPublic = publicPaths.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
        
        if (isPublic && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Set anonymous authentication so BearerTokenAuthenticationFilter skips this request
            AnonymousAuthenticationToken anonymousAuth = new AnonymousAuthenticationToken(
                "public-key",
                "anonymousUser",
                AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
            );
            SecurityContextHolder.getContext().setAuthentication(anonymousAuth);
        }
        
        filterChain.doFilter(request, response);
    }
}
