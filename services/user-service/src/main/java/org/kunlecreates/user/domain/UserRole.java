package org.kunlecreates.user.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "USER_ROLES")
public class UserRole {
    @EmbeddedId
    private UserRoleId id;

    @ManyToOne(optional = false)
    @MapsId("userId")
    @JoinColumn(name = "USER_ID")
    private User user;

    @ManyToOne(optional = false)
    @MapsId("roleId")
    @JoinColumn(name = "ROLE_ID")
    private Role role;

    protected UserRole() {}

    public UserRole(User user, Role role) {
        this.user = user;
        this.role = role;
        this.id = new UserRoleId(user.getId(), role.getId());
    }

    public UserRoleId getId() { return id; }
    public User getUser() { return user; }
    public Role getRole() { return role; }
}