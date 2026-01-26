package org.kunlecreates.user.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "LOGIN_AUDIT", indexes = {
    @Index(name = "ix_login_audit_user_id", columnList = "USER_ID"),
    @Index(name = "ix_login_audit_created_at", columnList = "CREATED_AT")
})
public class LoginAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = true)
    @JoinColumn(name = "USER_ID")
    private User user;

    @Column(name = "EMAIL", length = 320)
    private String email;

    @Column(name = "SUCCESS", nullable = false)
    private Integer success = 0;

    @Column(name = "REMOTE_IP", length = 64)
    private String remoteIp;

    @Column(name = "USER_AGENT", length = 255)
    private String userAgent;

    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();

    protected LoginAudit() {}

    public LoginAudit(User user, String email, boolean success, String remoteIp, String userAgent) {
        this.user = user;
        this.email = email;
        this.success = success ? 1 : 0;
        this.remoteIp = remoteIp;
        this.userAgent = userAgent;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getEmail() { return email; }
    public Integer getSuccess() { return success; }
    public String getRemoteIp() { return remoteIp; }
    public String getUserAgent() { return userAgent; }
    public Instant getCreatedAt() { return createdAt; }
}
