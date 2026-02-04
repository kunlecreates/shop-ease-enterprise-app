package org.kunlecreates.user.application;

import org.kunlecreates.user.domain.Role;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.repository.EmailVerificationTokenRepository;
import org.kunlecreates.user.repository.PasswordResetTokenRepository;
import org.kunlecreates.user.repository.RoleRepository;
import org.kunlecreates.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public UserService(UserRepository userRepository, 
                      RoleRepository roleRepository, 
                      EmailVerificationTokenRepository verificationTokenRepository,
                      PasswordResetTokenRepository passwordResetTokenRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Transactional(readOnly = true)
    public List<User> listUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User createUser(String email, String passwordHash) {
        User user = new User(email, passwordHash);
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public Optional<User> updateProfile(Long userId, String firstName, String lastName, String email) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        
        // Combine firstName and lastName into fullName
        if (firstName != null || lastName != null) {
            String first = firstName != null ? firstName : "";
            String last = lastName != null ? lastName : "";
            String fullName = (first + " " + last).trim();
            if (!fullName.isEmpty()) {
                user.setFullName(fullName);
            }
        }
        
        if (email != null && !email.equals(user.getEmail())) {
            // Check if email is already taken
            if (userRepository.findByEmail(email).isPresent()) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(email);
        }
        
        return Optional.of(userRepository.save(user));
    }

    @Transactional
    public boolean deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            return false;
        }
        
        // Delete child records first to avoid foreign key constraint violations
        // Using explicit JPQL queries for better performance and to avoid SELECT-then-DELETE
        verificationTokenRepository.deleteByUserId(userId);
        passwordResetTokenRepository.deleteByUserId(userId);
        
        userRepository.deleteById(userId);
        return true;
    }

    @Transactional
    public Optional<User> updateUserRole(Long userId, String roleName) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        Optional<Role> roleOpt = roleRepository.findByNameIgnoreCase(roleName);
        if (roleOpt.isEmpty()) {
            throw new IllegalArgumentException("Role not found: " + roleName);
        }

        User user = userOpt.get();
        user.getRoles().clear();
        user.addRole(roleOpt.get());
        
        return Optional.of(userRepository.save(user));
    }

    @Transactional
    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
        });
    }
}
