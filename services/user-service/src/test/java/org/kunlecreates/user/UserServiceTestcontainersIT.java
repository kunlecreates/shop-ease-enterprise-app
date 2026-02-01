package org.kunlecreates.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.context.annotation.Import;
import org.testcontainers.oracle.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.user.application.UserService;
import org.kunlecreates.user.test.TestContainersConfig;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@Import(TestContainersConfig.class)
@org.springframework.test.context.ActiveProfiles("test")
public class UserServiceTestcontainersIT {

    @Container
    static OracleContainer oracle = new OracleContainer("gvenzl/oracle-free:slim-faststart")
            .withUsername("USER_SVC")
            .withPassword("test")
            .withStartupTimeout(java.time.Duration.ofMinutes(5));

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", oracle::getJdbcUrl);
        registry.add("spring.datasource.username", oracle::getUsername);
        registry.add("spring.datasource.password", oracle::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "oracle.jdbc.OracleDriver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.OracleDialect");
        registry.add("spring.jpa.properties.hibernate.default_schema", oracle::getUsername);
    }

    @Autowired
    UserService userService;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void createAndFindUser_withPostgres() {
        userService.createUser("it-user@example.com", "pwdhash");
        Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE email = ?", new Object[]{"it-user@example.com"}, Integer.class);
        assertThat(count).isOne();
    }
}
