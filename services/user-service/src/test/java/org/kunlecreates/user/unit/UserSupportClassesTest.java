package org.kunlecreates.user.unit;

import org.junit.jupiter.api.Test;
import org.kunlecreates.user.domain.DomainEvent;
import org.kunlecreates.user.domain.LoginAudit;
import org.kunlecreates.user.domain.RefreshToken;
import org.kunlecreates.user.domain.Role;
import org.kunlecreates.user.domain.User;
import org.kunlecreates.user.domain.UserRole;
import org.kunlecreates.user.domain.UserRoleId;
import org.kunlecreates.user.interfaces.dto.UpdateProfileRequest;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class UserSupportClassesTest {

    @Test
    void userRoleId_shouldSupportEqualityAndHashCode() {
        UserRoleId left = new UserRoleId(1L, 2L);
        UserRoleId right = new UserRoleId(1L, 2L);
        UserRoleId different = new UserRoleId(1L, 3L);

        assertThat(left).isEqualTo(right);
        assertThat(left.hashCode()).isEqualTo(right.hashCode());
        assertThat(left).isNotEqualTo(different);
    }

    @Test
    void loginAudit_shouldStoreInputValues() {
        User user = new User("audit@shop.com", "hash");
        LoginAudit audit = new LoginAudit(user, "audit@shop.com", true, "127.0.0.1", "JUnit");

        assertThat(audit.getUser()).isEqualTo(user);
        assertThat(audit.getEmail()).isEqualTo("audit@shop.com");
        assertThat(audit.getSuccess()).isEqualTo(1);
        assertThat(audit.getRemoteIp()).isEqualTo("127.0.0.1");
        assertThat(audit.getUserAgent()).isEqualTo("JUnit");
        assertThat(audit.getCreatedAt()).isNotNull();
    }

    @Test
    void refreshToken_shouldExposeFieldsAndAllowRevocation() {
        User user = new User("refresh@shop.com", "hash");
        Instant expiry = Instant.now().plusSeconds(3600);
        RefreshToken token = new RefreshToken(user, "token-hash", expiry);

        assertThat(token.getUser()).isEqualTo(user);
        assertThat(token.getTokenHash()).isEqualTo("token-hash");
        assertThat(token.getExpiresAt()).isEqualTo(expiry);
        assertThat(token.getCreatedAt()).isNotNull();
        assertThat(token.getRevokedAt()).isNull();

        Instant revokedAt = Instant.now();
        token.revoke(revokedAt);
        assertThat(token.getRevokedAt()).isEqualTo(revokedAt);
    }

    @Test
    void domainEvent_shouldExposeConstructorState() {
        DomainEvent event = new DomainEvent("user-1", "USER_CREATED", "{\"id\":1}");
        assertThat(event.getAggregateId()).isEqualTo("user-1");
        assertThat(event.getType()).isEqualTo("USER_CREATED");
        assertThat(event.getPayload()).isEqualTo("{\"id\":1}");
        assertThat(event.getCreatedAt()).isNotNull();
        assertThat(event.getPublishedAt()).isNull();
    }

    @Test
    void userRole_shouldBuildEmbeddedIdFromUserAndRole() {
        User user = new User("role@shop.com", "hash");
        Role role = new Role("ADMIN");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 7L);
        org.springframework.test.util.ReflectionTestUtils.setField(role, "id", 3L);

        UserRole userRole = new UserRole(user, role);

        assertThat(userRole.getUser()).isEqualTo(user);
        assertThat(userRole.getRole()).isEqualTo(role);
        assertThat(userRole.getId().getUserId()).isEqualTo(7L);
        assertThat(userRole.getId().getRoleId()).isEqualTo(3L);
    }

    @Test
    void updateProfileRequest_shouldExposeRecordFields() {
        UpdateProfileRequest request = new UpdateProfileRequest("Ada", "Lovelace", "ada@shop.com", "oldpass", "newpass");
        assertThat(request.firstName()).isEqualTo("Ada");
        assertThat(request.lastName()).isEqualTo("Lovelace");
        assertThat(request.email()).isEqualTo("ada@shop.com");
        assertThat(request.currentPassword()).isEqualTo("oldpass");
        assertThat(request.newPassword()).isEqualTo("newpass");
    }
}