#!/bin/bash
# Quick wrapper for generating BCrypt password hashes and hashed UUID tokens

if [ $# -eq 0 ]; then
    echo "Usage: ./generate-hash.sh <command|password> [rounds]"
    echo ""
    echo "Commands:"
    echo "  --uuid, -u [rounds]   Generate random UUID + BCrypt hash"
    echo "  <password> [rounds]   Generate BCrypt password hash"
    echo ""
    echo "Password Hash Examples:"
    echo "  ./generate-hash.sh Admin123!        # Hash password with rounds=4"
    echo "  ./generate-hash.sh Admin123! 10     # Hash password with rounds=10"
    echo ""
    echo "UUID Token Examples:"
    echo "  ./generate-hash.sh --uuid           # Generate UUID + hash with rounds=4"
    echo "  ./generate-hash.sh --uuid 10        # Generate UUID + hash with rounds=10"
    exit 1
fi

cd "$(dirname "$0")"

# Compile if needed
if [ ! -d "target/classes" ] || [ ! -f "target/classes/org/kunlecreates/user/util/PasswordHashGenerator.class" ]; then
    echo "Compiling..."
    mvn compile -q
fi

# Run the generator
mvn exec:java -q -Dexec.mainClass="org.kunlecreates.user.util.PasswordHashGenerator" -Dexec.args="$*"
