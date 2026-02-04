package org.kunlecreates.user.repository;

import org.kunlecreates.user.domain.EmailVerificationToken;
import org.kunlecreates.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);
    boolean existsByUserAndUsedAtIsNullAndExpiresAtAfter(User user, Instant now);
    void deleteByUserAndUsedAtIsNotNull(User user);
    void deleteByUser(User user);
}
