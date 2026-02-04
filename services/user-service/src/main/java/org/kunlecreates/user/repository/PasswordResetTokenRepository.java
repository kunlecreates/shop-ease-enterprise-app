package org.kunlecreates.user.repository;

import org.kunlecreates.user.domain.PasswordResetToken;
import org.kunlecreates.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    /*Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    // Find unused tokens for a given user
    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);*/

    // Existence check for unused token that hasn't expired
    boolean existsByUserAndUsedAtIsNullAndExpiresAtAfter(User user, LocalDateTime now);

    List<PasswordResetToken> findByUsedAtIsNullAndExpiresAtAfter(LocalDateTime now);
    
    @Transactional
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
