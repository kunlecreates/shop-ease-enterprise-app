package org.kunlecreates.user.repository;

import org.kunlecreates.user.domain.EmailVerificationToken;
import org.kunlecreates.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);
    boolean existsByUserAndUsedAtIsNullAndExpiresAtAfter(User user, Instant now);
    
    @Transactional
    @Modifying
    void deleteByUserAndUsedAtIsNotNull(User user);
    
    @Transactional
    @Modifying
    void deleteByUser(User user);
}
