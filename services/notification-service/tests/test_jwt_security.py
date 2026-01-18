"""
Security tests for Notification Service JWT authentication
Tests PRD FR014 (Notification System) and FR015 (Security)
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import jwt
import os

# Import the FastAPI app
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# JWT_SECRET is set in conftest.py, so just read it here
# Do not override it - use the value from conftest
TEST_JWT_SECRET = os.getenv('JWT_SECRET', 'test-secret-key-for-integration-tests')

from app.main import app

client = TestClient(app)


def generate_token(user_id: str, email: str, roles: list[str], expired: bool = False) -> str:
    """Generate a JWT token for testing"""
    exp_time = datetime.utcnow() - timedelta(hours=1) if expired else datetime.utcnow() + timedelta(hours=1)
    
    payload = {
        'sub': user_id,
        'email': email,
        'roles': roles,
        'iss': 'shopease',
        'iat': datetime.utcnow(),
        'exp': exp_time
    }
    
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm='HS256')


class TestHealthEndpoints:
    """Test public health endpoints"""
    
    def test_health_endpoint_public_access(self):
        """Health endpoint should be accessible without JWT"""
        response = client.get('/health')
        assert response.status_code == 200
        assert response.json()['status'] in ['ok', 'healthy']
    
    def test_health_endpoint_with_jwt(self):
        """Health endpoint should work with JWT too"""
        token = generate_token('100', 'user@example.com', ['USER'])
        response = client.get('/health', headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 200


class TestNotificationEndpointSecurity:
    """Test JWT security on notification endpoints"""
    
    def test_notification_test_endpoint_requires_jwt(self):
        """Notification test endpoint should reject requests without JWT (401/403)"""
        response = client.post('/api/notification/test', json={
            'userId': '100',
            'type': 'email',
            'subject': 'Test',
            'body': 'Test message'
        })
        assert response.status_code in [401, 403]
    
    def test_notification_test_endpoint_accepts_valid_jwt(self):
        """Notification test endpoint should accept valid JWT (200)"""
        token = generate_token('100', 'user@example.com', ['USER'])
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '100',
                'type': 'email',
                'subject': 'Test',
                'body': 'Test message'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code in [200, 201]
    
    def test_notification_test_endpoint_rejects_expired_jwt(self):
        """Notification test endpoint should reject expired JWT (401)"""
        expired_token = generate_token('100', 'user@example.com', ['USER'], expired=True)
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '100',
                'type': 'email',
                'subject': 'Test',
                'body': 'Test message'
            },
            headers={'Authorization': f'Bearer {expired_token}'}
        )
        assert response.status_code == 401
    
    def test_notification_test_endpoint_rejects_invalid_signature(self):
        """Notification test endpoint should reject JWT with wrong signature (401)"""
        # Generate token with wrong secret
        wrong_token = jwt.encode({
            'sub': '100',
            'email': 'user@example.com',
            'roles': ['USER'],
            'iss': 'shopease',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, 'wrong-secret', algorithm='HS256')
        
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '100',
                'type': 'email',
                'subject': 'Test',
                'body': 'Test message'
            },
            headers={'Authorization': f'Bearer {wrong_token}'}
        )
        assert response.status_code == 401
    
    def test_notification_test_endpoint_rejects_malformed_token(self):
        """Notification test endpoint should reject malformed JWT (401)"""
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '100',
                'type': 'email',
                'subject': 'Test',
                'body': 'Test message'
            },
            headers={'Authorization': 'Bearer not-a-valid-token'}
        )
        assert response.status_code == 401
    
    def test_notification_test_endpoint_rejects_missing_bearer_prefix(self):
        """Notification test endpoint should reject Authorization without 'Bearer ' prefix (401/403)"""
        token = generate_token('100', 'user@example.com', ['USER'])
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '100',
                'type': 'email',
                'subject': 'Test',
                'body': 'Test message'
            },
            headers={'Authorization': token}  # Missing 'Bearer ' prefix
        )
        assert response.status_code in [401, 403]
    
    def test_notification_endpoint_works_with_admin_role(self):
        """Admin users should also be able to send test notifications"""
        token = generate_token('1', 'admin@example.com', ['ADMIN'])
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '100',
                'type': 'email',
                'subject': 'Admin Test',
                'body': 'Admin test message'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        assert response.status_code in [200, 201]


class TestJWTPayloadExtraction:
    """Test that JWT payload is correctly extracted and used"""
    
    def test_jwt_user_id_extraction(self):
        """Verify that user ID is extracted from JWT 'sub' claim"""
        token = generate_token('999', 'testuser@example.com', ['USER'])
        response = client.post(
            '/api/notification/test',
            json={
                'userId': '999',
                'type': 'email',
                'subject': 'ID Test',
                'body': 'Testing user ID extraction'
            },
            headers={'Authorization': f'Bearer {token}'}
        )
        # Should succeed if userId matches JWT sub
        assert response.status_code in [200, 201]
