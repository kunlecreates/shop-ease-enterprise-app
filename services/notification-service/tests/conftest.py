"""
Global pytest configuration for notification-service tests.
Sets up environment variables before any test modules are imported.
"""
import os
import sys

# Add parent directory to path so tests can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set JWT_SECRET before any modules that depend on it are imported
# This must match the secret used by integration tests
os.environ['JWT_SECRET'] = 'test-secret-key-for-integration-tests'
