-- Test-only migration for user table (shared module)
CREATE TABLE IF NOT EXISTS USERS (
  ID BIGSERIAL PRIMARY KEY,
  EMAIL VARCHAR(255) NOT NULL UNIQUE,
  PASSWORD_HASH VARCHAR(255) NOT NULL,
  CREATED_AT TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ROLES (
  ID BIGSERIAL PRIMARY KEY,
  NAME VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS USER_ROLES (
  USER_ID BIGINT NOT NULL,
  ROLE_ID BIGINT NOT NULL,
  PRIMARY KEY (USER_ID, ROLE_ID),
  FOREIGN KEY (USER_ID) REFERENCES USERS(ID) ON DELETE CASCADE,
  FOREIGN KEY (ROLE_ID) REFERENCES ROLES(ID) ON DELETE CASCADE
);

-- Insert test users so integration tests that reference specific user IDs
-- (for example: createOrder(2L, ...)) have the expected rows available.
INSERT INTO USERS (EMAIL, PASSWORD_HASH) VALUES ('user1@example.com', 'password-placeholder');
INSERT INTO USERS (EMAIL, PASSWORD_HASH) VALUES ('user2@example.com', 'password-placeholder');

-- Ensure the sequence for USERS.id advances past inserted rows.
SELECT setval(pg_get_serial_sequence('users','id'), COALESCE(MAX(id), 1)) FROM users;
