-- Test-only migration for user table (Microsoft SQL Server)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type = 'U')
BEGIN
    CREATE TABLE dbo.[users] (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL CONSTRAINT uq_users_email UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_users_created DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type = 'U')
BEGIN
    CREATE TABLE dbo.[roles] (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL CONSTRAINT uq_roles_name UNIQUE
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_roles]') AND type = 'U')
BEGIN
    CREATE TABLE dbo.[user_roles] (
        user_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,
        CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
        CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES dbo.[users](id) ON DELETE CASCADE,
        CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES dbo.[roles](id) ON DELETE CASCADE
    );
END
