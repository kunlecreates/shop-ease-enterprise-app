package org.kunlecreates.user.unit;

import org.junit.jupiter.api.Test;
import org.kunlecreates.user.util.PasswordHashGenerator;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordHashGeneratorTest {

    @Test
    void main_shouldGeneratePasswordHashOutputForPasswordMode() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintStream originalOut = System.out;
        try {
            System.setOut(new PrintStream(out));
            PasswordHashGenerator.main(new String[]{"MyPassword123", "4"});
        } finally {
            System.setOut(originalOut);
        }

        String output = out.toString(StandardCharsets.UTF_8);
        assertThat(output).contains("=== BCrypt Password Hash ===");
        assertThat(output).contains("Password: MyPassword123");
    }

    @Test
    void main_shouldGenerateUuidOutputForUuidMode() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintStream originalOut = System.out;
        try {
            System.setOut(new PrintStream(out));
            PasswordHashGenerator.main(new String[]{"--uuid", "4"});
        } finally {
            System.setOut(originalOut);
        }

        String output = out.toString(StandardCharsets.UTF_8);
        assertThat(output).contains("=== UUID Token + BCrypt Hash ===");
        assertThat(output).contains("Plain UUID Token:");
        assertThat(output).contains("BCrypt Hash:");
    }

    @Test
    void printUsage_shouldPrintHelpText() throws Exception {
        ByteArrayOutputStream err = new ByteArrayOutputStream();
        PrintStream originalErr = System.err;
        try {
            System.setErr(new PrintStream(err));
            Method printUsage = PasswordHashGenerator.class.getDeclaredMethod("printUsage");
            printUsage.setAccessible(true);
            printUsage.invoke(null);
        } finally {
            System.setErr(originalErr);
        }

        String output = err.toString(StandardCharsets.UTF_8);
        assertThat(output).contains("Usage: PasswordHashGenerator");
        assertThat(output).contains("--uuid");
        assertThat(output).contains("Password Hash Examples");
    }
}