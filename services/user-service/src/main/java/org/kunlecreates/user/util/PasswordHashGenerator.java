package org.kunlecreates.user.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.UUID;

/**
 * Standalone utility for generating BCrypt password hashes and hashed UUID tokens.
 * 
 * Usage from user-service directory:
 *   mvn compile
 * 
 * Password Hashing:
 *   mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" -Dexec.args="YourPassword123"
 *   mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" -Dexec.args="Password 10"
 * 
 * UUID Token Generation (generates UUID + BCrypt hash):
 *   mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" -Dexec.args="--uuid"
 *   mvn exec:java -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" -Dexec.args="--uuid 10"
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        if (args.length == 0) {
            printUsage();
            System.exit(1);
        }

        // UUID token generation mode (generates UUID + BCrypt hash)
        if (args[0].equals("--uuid") || args[0].equals("-u")) {
            int rounds = 4; // Default BCrypt rounds for tokens
            if (args.length > 1) {
                try {
                    rounds = Integer.parseInt(args[1]);
                    if (rounds < 4 || rounds > 31) {
                        System.err.println("Error: Rounds must be between 4 and 31");
                        System.exit(1);
                    }
                } catch (NumberFormatException e) {
                    System.err.println("Error: Invalid rounds value. Must be an integer.");
                    System.exit(1);
                }
            }
            generateHashedUUID(rounds);
            return;
        }

        // Password hashing mode
        String password = args[0];
        int rounds = 4;
        
        if (args.length > 1) {
            try {
                rounds = Integer.parseInt(args[1]);
                if (rounds < 4 || rounds > 31) {
                    System.err.println("Error: Rounds must be between 4 and 31");
                    System.exit(1);
                }
            } catch (NumberFormatException e) {
                System.err.println("Error: Invalid rounds value. Must be an integer.");
                System.exit(1);
            }
        }

        generatePasswordHash(password, rounds);
    }

    private static void printUsage() {
        System.err.println("Usage: PasswordHashGenerator <command|password> [rounds]");
        System.err.println();
        System.err.println("Commands:");
        System.err.println("  --uuid, -u [rounds]   Generate random UUID + BCrypt hash");
        System.err.println("  <password> [rounds]   Generate BCrypt password hash");
        System.err.println();
        System.err.println("Password Hash Examples:");
        System.err.println("  PasswordHashGenerator Admin123!        # BCrypt with rounds=4 (testing)");
        System.err.println("  PasswordHashGenerator Admin123! 10     # BCrypt with rounds=10 (production)");
        System.err.println();
        System.err.println("UUID Token Examples:");
        System.err.println("  PasswordHashGenerator --uuid           # Generate UUID + hash with rounds=4");
        System.err.println("  PasswordHashGenerator --uuid 10        # Generate UUID + hash with rounds=10");
        System.err.println();
        System.err.println("Use Cases:");
        System.err.println("  - Password hashing for user authentication");
        System.err.println("  - UUID token + hash for refresh tokens, password reset, email verification");
        System.err.println();
        System.err.println("Token Flow:");
        System.err.println("  1. Generate UUID token (plain text) - send to user/store in email");
        System.err.println("  2. Store BCrypt hash in database");
        System.err.println("  3. When user provides token, hash it and compare with stored hash");
    }

    private static void generatePasswordHash(String password, int rounds) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(rounds);
        String hash = encoder.encode(password);
        
        System.out.println("=== BCrypt Password Hash ===");
        System.out.println("Password: " + password);
        System.out.println("Rounds:   " + rounds);
        System.out.println("Hash:     " + hash);
        System.out.println();
        System.out.println("SQL Usage:");
        System.out.println("  '" + hash + "'");
    }

    private static void generateHashedUUID(int rounds) {
        // Generate random UUID
        String uuid = UUID.randomUUID().toString();
        
        // Hash the UUID with BCrypt
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(rounds);
        String hash = encoder.encode(uuid);
        
        System.out.println("=== UUID Token + BCrypt Hash ===");
        System.out.println("Plain UUID Token: " + uuid);
        System.out.println("Rounds:           " + rounds);
        System.out.println("BCrypt Hash:      " + hash);
        System.out.println();
        System.out.println("Usage:");
        System.out.println("  1. Send plain UUID to user:    " + uuid);
        System.out.println("  2. Store BCrypt hash in DB:    '" + hash + "'");
        System.out.println();
        System.out.println("SQL Example:");
        System.out.println("  INSERT INTO refresh_tokens (user_id, token, expires_at)");
        System.out.println("  VALUES (1, '" + hash + "', CURRENT_TIMESTAMP + INTERVAL '30' DAY);");
        System.out.println();
        System.out.println("Verification Flow:");
        System.out.println("  - User provides token: " + uuid);
        System.out.println("  - Hash provided token with BCrypt");
        System.out.println("  - Compare hash with stored hash in database");
    }
}
