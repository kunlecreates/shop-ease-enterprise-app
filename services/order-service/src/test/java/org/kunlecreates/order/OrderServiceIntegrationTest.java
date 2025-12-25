package org.kunlecreates.order;

import org.junit.jupiter.api.Test;
import org.kunlecreates.order.application.OrderService;
import org.kunlecreates.order.domain.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false"
})
class OrderServiceIntegrationTest {

    @Autowired
    OrderService orderService;

    @Test
    @Transactional
    void createAndFind() {
        Order o = orderService.createOrder(null, 1L, "CREATED", 123.45);
        assertThat(o.getId()).isNotNull();
        assertThat(orderService.findById(o.getId())).isPresent();
    }
}
