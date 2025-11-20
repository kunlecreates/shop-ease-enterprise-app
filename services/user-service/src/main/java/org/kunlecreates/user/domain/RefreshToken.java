package org.kunlecreates.user.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "REFRESH_TOKENS")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "USER_ID")
    private User user;
    @Column(name = "TOKEN", nullable = false, unique = true)
    private String token;
    @Column(name = "EXPIRES_AT", nullable = false)
    private Instant expiresAt;
    @Column(name = "REVOKED", nullable = false)
    private boolean revoked = false;
    protected RefreshToken() {}
    public RefreshToken(User user, String token, Instant expiresAt) { this.user = user; this.token = token; this.expiresAt = expiresAt; }
    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getToken() { return token; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isRevoked() { return revoked; }
    public void revoke() { this.revoked = true; }
}