package org.kunlecreates.user.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "ROLES")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "NAME", nullable = false, unique = true)
    private String name;
    protected Role() {}
    public Role(String name) { this.name = name; }
    public Long getId() { return id; }
    public String getName() { return name; }
}