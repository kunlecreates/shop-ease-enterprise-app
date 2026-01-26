-- user-service schema (Oracle 12c+)
-- Run as the owning user (e.g., USER_SVC). This script does not create users.

-- Core users and RBAC -------------------------------------------------------
CREATE TABLE users (
  id              NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           VARCHAR2(320) NOT NULL,
  password_hash   VARCHAR2(255) NOT NULL,
  full_name       VARCHAR2(200),
  is_active       NUMBER(1) DEFAULT 1 NOT NULL CHECK (is_active IN (0,1)),
  created_at      TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at      TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
  last_login_at   TIMESTAMP(6),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE roles (
  id    NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  VARCHAR2(100) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
  user_id  NUMBER(19) NOT NULL,
  role_id  NUMBER(19) NOT NULL,
  CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Idempotent creation if needed (e.g., upgrading existing schema lacking named constraint):
DECLARE
  v_cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cnt FROM user_constraints 
    WHERE table_name = 'USERS' AND constraint_type='U' AND constraint_name='UQ_USERS_EMAIL';
  IF v_cnt = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE USERS ADD CONSTRAINT UQ_USERS_EMAIL UNIQUE (EMAIL)';
  END IF;
END;
/

-- Auth tokens ---------------------------------------------------------------
CREATE TABLE refresh_tokens (
  id          NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     NUMBER(19) NOT NULL,
  token_hash  VARCHAR2(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP(6) NOT NULL,
  created_at  TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
  revoked_at  TIMESTAMP(6),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE email_verification_tokens (
  id           NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      NUMBER(19) NOT NULL,
  token_hash   VARCHAR2(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMP(6) NOT NULL,
  used_at      TIMESTAMP(6),
  created_at   TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_reset_tokens (
  id           NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      NUMBER(19) NOT NULL,
  token_hash   VARCHAR2(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMP(6) NOT NULL,
  used_at      TIMESTAMP(6),
  created_at   TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Login audit ---------------------------------------------------------------
CREATE TABLE login_audit (
  id           NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      NUMBER(19),
  email        VARCHAR2(320),
  success      NUMBER(1) DEFAULT 0 NOT NULL CHECK (success IN (0,1)),
  remote_ip    VARCHAR2(64),
  user_agent   VARCHAR2(255),
  created_at   TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL
);

CREATE INDEX ix_login_audit_user_id ON login_audit(user_id);
CREATE INDEX ix_login_audit_created_at ON login_audit(created_at);

-- Optional outbox for domain events ----------------------------------------
CREATE TABLE domain_events (
  id           NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id VARCHAR2(64) NOT NULL,
  type         VARCHAR2(100) NOT NULL,
  payload      CLOB CHECK (payload IS JSON),
  created_at   TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
  published_at TIMESTAMP(6)
);

-- Seed baseline roles idempotently -----------------------------------------
MERGE INTO roles d
USING (SELECT 'customer' AS name FROM dual UNION ALL SELECT 'admin' FROM dual) s
ON (d.name = s.name)
WHEN NOT MATCHED THEN INSERT (name) VALUES (s.name);

