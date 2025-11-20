package org.kunlecreates.user.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "USERS")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;
    @Column(name = "PASSWORD_HASH", nullable = false)
    private String passwordHash;
    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();

    protected User() {}
    public User(String email, String passwordHash) { this.email = email; this.passwordHash = passwordHash; }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Instant getCreatedAt() { return createdAt; }
}