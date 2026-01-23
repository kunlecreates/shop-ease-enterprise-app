package org.kunlecreates.user.repository;

import org.kunlecreates.user.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    
    @Query("SELECT r FROM Role r WHERE UPPER(r.name) = UPPER(:name)")
    Optional<Role> findByNameIgnoreCase(@Param("name") String name);
}