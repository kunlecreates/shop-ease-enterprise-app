package org.kunlecreates.user.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.domain.Role;
import org.kunlecreates.user.repository.UserRepository;
import org.kunlecreates.user.repository.RoleRepository;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        testUser = new User("test@example.com", "hashedPassword");
        ReflectionTestUtils.setField(testUser, "id", 1L);
        testUser.setFullName("Original Name");
        
        adminRole = new Role("admin");
        ReflectionTestUtils.setField(adminRole, "id", 2L);
    }

    @Test
    void updateProfile_whenEmailAlreadyExists_shouldThrowException() {
        User anotherUser = new User("taken@example.com", "password");
        ReflectionTestUtils.setField(anotherUser, "id", 2L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("taken@example.com")).thenReturn(Optional.of(anotherUser));

        assertThatThrownBy(() -> userService.updateProfile(1L, null, null, "taken@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already in use");

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_shouldCombineFirstNameAndLastNameIntoFullName() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.updateProfile(1L, "John", "Doe", null);

        assertThat(result).isPresent();
        assertThat(result.get().getFullName()).isEqualTo("John Doe");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_withOnlyFirstName_shouldSetFullNameCorrectly() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.updateProfile(1L, "Alice", null, null);

        assertThat(result).isPresent();
        assertThat(result.get().getFullName()).isEqualTo("Alice");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_withOnlyLastName_shouldSetFullNameCorrectly() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.updateProfile(1L, null, "Smith", null);

        assertThat(result).isPresent();
        assertThat(result.get().getFullName()).isEqualTo("Smith");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_shouldAllowUpdatingEmailWhenUnique() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.findByEmail("newemail@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.updateProfile(1L, null, null, "newemail@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("newemail@example.com");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_whenUserNotFound_shouldReturnEmpty() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<User> result = userService.updateProfile(999L, "John", "Doe", null);

        assertThat(result).isEmpty();
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteUser_whenUserDoesNotExist_shouldReturnFalse() {
        when(userRepository.existsById(999L)).thenReturn(false);

        boolean result = userService.deleteUser(999L);

        assertThat(result).isFalse();
        verify(userRepository, never()).deleteById(anyLong());
    }

    @Test
    void deleteUser_whenUserExists_shouldDeleteAndReturnTrue() {
        when(userRepository.existsById(1L)).thenReturn(true);

        boolean result = userService.deleteUser(1L);

        assertThat(result).isTrue();
        verify(userRepository).deleteById(1L);
    }

    @Test
    void updateUserRole_whenRoleDoesNotExist_shouldThrowException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(roleRepository.findByNameIgnoreCase("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUserRole(1L, "nonexistent"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Role not found: nonexistent");

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserRole_shouldClearExistingRolesAndAddNewRole() {
        Role customerRole = new Role("customer");
        ReflectionTestUtils.setField(customerRole, "id", 1L);
        testUser.getRoles().add(customerRole);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(roleRepository.findByNameIgnoreCase("admin")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.updateUserRole(1L, "admin");

        assertThat(result).isPresent();
        assertThat(result.get().getRoles()).hasSize(1);
        assertThat(result.get().getRoles()).contains(adminRole);
        assertThat(result.get().getRoles()).doesNotContain(customerRole);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserRole_whenUserNotFound_shouldReturnEmpty() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<User> result = userService.updateUserRole(999L, "admin");

        assertThat(result).isEmpty();
        verify(roleRepository, never()).findByNameIgnoreCase(anyString());
        verify(userRepository, never()).save(any());
    }
}
