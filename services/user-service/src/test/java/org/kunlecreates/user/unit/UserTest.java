package org.kunlecreates.user.unit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.domain.Role;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    private User user;
    private Role customerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "hashedPassword");
        ReflectionTestUtils.setField(user, "id", 1L);
        
        customerRole = new Role("customer");
        ReflectionTestUtils.setField(customerRole, "id", 1L);
        
        adminRole = new Role("admin");
        ReflectionTestUtils.setField(adminRole, "id", 2L);
    }

    @Test
    void addRole_shouldAddRoleToCollection() {
        user.addRole(customerRole);

        assertThat(user.getRoles()).hasSize(1);
        assertThat(user.getRoles()).contains(customerRole);
    }

    @Test
    void addRole_shouldUpdateUpdatedAtTimestamp() {
        LocalDateTime beforeAdd = user.getUpdatedAt();
        
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        user.addRole(customerRole);

        assertThat(user.getUpdatedAt()).isAfter(beforeAdd);
    }

    @Test
    void addRole_shouldNotAddDuplicateRole() {
        user.addRole(customerRole);
        user.addRole(customerRole);

        assertThat(user.getRoles()).hasSize(1);
    }

    @Test
    void removeRole_shouldRemoveRoleFromCollection() {
        user.addRole(customerRole);
        user.addRole(adminRole);

        user.removeRole(customerRole);

        assertThat(user.getRoles()).hasSize(1);
        assertThat(user.getRoles()).contains(adminRole);
        assertThat(user.getRoles()).doesNotContain(customerRole);
    }

    @Test
    void removeRole_shouldUpdateUpdatedAtTimestamp() {
        user.addRole(customerRole);
        LocalDateTime beforeRemove = user.getUpdatedAt();
        
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        user.removeRole(customerRole);

        assertThat(user.getUpdatedAt()).isAfter(beforeRemove);
    }

    @Test
    void setEmail_shouldUpdateEmail() {
        user.setEmail("newemail@example.com");

        assertThat(user.getEmail()).isEqualTo("newemail@example.com");
    }

    @Test
    void setEmail_shouldUpdateUpdatedAtTimestamp() {
        LocalDateTime beforeUpdate = user.getUpdatedAt();
        
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        user.setEmail("updated@example.com");

        assertThat(user.getUpdatedAt()).isAfter(beforeUpdate);
    }

    @Test
    void setFullName_shouldUpdateUpdatedAtTimestamp() {
        LocalDateTime beforeUpdate = user.getUpdatedAt();
        
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        user.setFullName("John Doe");

        assertThat(user.getUpdatedAt()).isAfter(beforeUpdate);
        assertThat(user.getFullName()).isEqualTo("John Doe");
    }

    @Test
    void constructor_shouldInitializeEmailAndPasswordHash() {
        User newUser = new User("user@test.com", "hashedPass");

        assertThat(newUser.getEmail()).isEqualTo("user@test.com");
        assertThat(newUser.getPasswordHash()).isEqualTo("hashedPass");
        assertThat(newUser.getRoles()).isEmpty();
        assertThat(newUser.getCreatedAt()).isNotNull();
        assertThat(newUser.getUpdatedAt()).isNotNull();
    }
}
