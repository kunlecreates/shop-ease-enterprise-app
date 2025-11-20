package org.kunlecreates.user;

import org.junit.jupiter.api.Test;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.domain.User;
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
class UserServiceIntegrationTest {

    @Autowired
    UserService userService;

    @Test
    @Transactional
    void createAndFindByEmail() {
        User created = userService.createUser("test@example.com", "hashedpwd");
        assertThat(created.getId()).isNotNull();
        assertThat(userService.findByEmail("test@example.com")).isPresent();
    }
}
