package org.kunlecreates.order.repository;

import org.kunlecreates.order.domain.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserRefAndStatus(String userRef, String status);
}
