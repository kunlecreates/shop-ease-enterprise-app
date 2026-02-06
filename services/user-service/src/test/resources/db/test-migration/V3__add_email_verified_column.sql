-- Add email_verified column to users table
ALTER TABLE USERS ADD email_verified NUMBER(1) DEFAULT 0 NOT NULL CHECK (email_verified IN (0,1));

-- Update existing users to have verified email (for backward compatibility)
UPDATE USERS SET email_verified = 1;

-- Create index for faster lookups
CREATE INDEX ix_users_email_verified ON USERS(email_verified);
