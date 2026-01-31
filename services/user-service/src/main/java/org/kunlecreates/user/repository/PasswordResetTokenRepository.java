package org.kunlecreates.user.repository;

import org.kunlecreates.user.domain.PasswordResetToken;
import org.kunlecreates.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    /*Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    // Find unused tokens for a given user
    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);*/

    // Existence check for unused token that hasn't expired
    boolean existsByUserAndUsedAtIsNullAndExpiresAtAfter(User user, Instant now);

    List<PasswordResetToken> findByUsedAtIsNullAndExpiresAtAfter(Instant now);
}
