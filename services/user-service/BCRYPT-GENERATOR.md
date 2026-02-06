# BCrypt Password Hash & UUID Token Generator

This utility generates:
1. **BCrypt hashes of passwords** - for user authentication
2. **Random UUID + BCrypt hash** - for secure tokens (refresh tokens, password reset, etc.)

## Quick Start

```bash
cd services/user-service

# Generate password hash
./generate-hash.sh "Admin123!"

# Generate UUID token + hash
./generate-hash.sh --uuid
```

## How Token Hashing Works

When you need a secure token (refresh token, password reset, etc.):

1. **Generate**: Create random UUID + BCrypt hash
2. **Send**: Give the **plain UUID** to the user (in email, response, etc.)
3. **Store**: Save the **BCrypt hash** in your database
4. **Verify**: When user provides token, hash it and compare with stored hash

This prevents token theft from database breaches (attacker only gets hashes, not actual tokens).

## Usage Options

### Option 1: Shell Script (Recommended)
```bash
cd services/user-service

# PASSWORD HASHING
# Generate hash with default rounds (4 - testing)
./generate-hash.sh "Admin123!"

# Generate hash with production rounds (10)
./generate-hash.sh "Admin123!" 10

# UUID TOKEN GENERATION (UUID + Hash)
# Generate token with default rounds (4)
./generate-hash.sh --uuid

# Generate token with production rounds (10)
./generate-hash.sh --uuid 10
```

### Option 2: Maven Exec
```bash
cd services/user-service
mvn compile

# Password hashing - Default rounds (4)
mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" \
              -Dexec.args="Admin123!"

# Password hashing - Custom rounds
mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" \
              -Dexec.args="Admin123! 10"

# UUID token generation - Default rounds (4)
mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" \
              -Dexec.args="--uuid"

# UUID token generation - Custom rounds (10)
mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" \
              -Dexec.args="--uuid 10"
```

### Option 3: Direct Java Execution
```bash
cd services/user-service
mvn compile

java -cp "target/classes:$(mvn dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q)" \
     org.kunlecreates.user.util.PasswordHashGenerator "Admin123!"
```

## Configuration Matching

**Current JwtConfig setting**: `BCryptPasswordEncoder(4)` - 4 rounds for faster testing

- **Testing/Development**: Use rounds=4 (default)
- **Production**: Use rounds=10-12

⚠️ **Important**: The hash must match the rounds configured in `JwtConfig.java`

## Output Format

```
Password: Admin123!
Rounds:   4
Hash:     $2a$04$abcdefghijklmnopqrstuv...

SQL Usage:
  '$2a$04$abcdefghijklmnopqrstuv...'
```

## Common Use Cases

### Generate password hashes for seed data
```bash
./generate-hash.sh "Admin123!"
./generate-hash.sh "Test123!"
```

### Generate refresh token for a user
```bash
# This generates a random UUID and its BCrypt hash
./generate-hash.sh --uuid

# Output will show:
# Plain UUID Token: abc-123-def-456 (send this to user)
# BCrypt Hash: $2a$04$... (store this in database)
```

### Generate password reset token
```bash
# Same as refresh token - generates UUID + hash
./generate-hash.sh --uuid 10  # Use production rounds
```

### Complete seed data workflow
```bash
# 1. Generate admin password hash
./generate-hash.sh "Admin123!" 4

# 2. Generate refresh token for that admin
./generate-hash.sh --uuid 4

# 3. Insert into database:
# INSERT INTO users (email, password_hash) VALUES ('admin@shopease.com', '<password_hash>');
# INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (1, '<token_hash>', ...);
```

### Update JwtConfig rounds
If you change `BCryptPasswordEncoder(4)` to `BCryptPasswordEncoder(10)` in JwtConfig.java,
regenerate all hashes with rounds=10:
```bash
./generate-hash.sh "Admin123!" 10
```

## Files

- `src/main/java/org/kunlecreates/user/util/PasswordHashGenerator.java` - Main utility class
- `generate-hash.sh` - Convenient shell wrapper
- `src/main/java/org/kunlecreates/user/infrastructure/security/JwtConfig.java` - BCrypt configuration

## Troubleshooting

**Q: Getting compilation errors?**
```bash
mvn clean compile
```

**Q: Need to update Maven dependencies?**
```bash
mvn dependency:resolve
```

**Q: Want to verify a hash works?**
Test by attempting login with the user-service API using the password.
