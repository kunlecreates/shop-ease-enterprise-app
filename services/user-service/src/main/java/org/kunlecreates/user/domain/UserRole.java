package org.kunlecreates.user.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "USER_ROLES")
public class UserRole {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "USER_ID")
    private User user;
    @ManyToOne(optional = false)
    @JoinColumn(name = "ROLE_ID")
    private Role role;
    protected UserRole() {}
    public UserRole(User user, Role role) { this.user = user; this.role = role; }
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Role getRole() { return role; }
}