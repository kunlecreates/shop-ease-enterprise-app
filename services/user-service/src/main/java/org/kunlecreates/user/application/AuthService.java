package org.kunlecreates.user.application;

import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.repository.RoleRepository;
import org.kunlecreates.user.infrastructure.security.JwtService;
import org.kunlecreates.user.interfaces.dto.AuthResponse;
import org.kunlecreates.user.interfaces.dto.CreateUserRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(CreateUserRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("User already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.email(), hashedPassword);
        user = userRepository.save(user);

        var customerRole = roleRepository.findByName("customer")
                .orElseThrow(() -> new IllegalStateException("Customer role not found"));
        user.getRoles().add(customerRole);
        userRepository.save(user);

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList());

        String token = jwtService.generateToken(
            String.valueOf(user.getId()),
            user.getEmail(),
            roles
        );

        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList());

        String token = jwtService.generateToken(
            String.valueOf(user.getId()),
            user.getEmail(),
            roles
        );

        return new AuthResponse(token, String.valueOf(user.getId()), user.getEmail());
    }
}
