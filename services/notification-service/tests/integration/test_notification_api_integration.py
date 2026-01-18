"""
Integration tests for Notification Service REST API endpoints.
Tests full stack: FastAPI → Email Service → External Email Provider (mocked)

These tests validate:
- API endpoint functionality
- JWT authentication and authorization
- Request validation
- Email sending logic
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app
from app.models.email import EmailResponse
import jwt
from datetime import datetime, timedelta

# Create test client
client = TestClient(app)

# Test JWT secret (should match app config)
TEST_JWT_SECRET = "test-secret-key-for-integration-tests"
TEST_JWT_ALGORITHM = "HS256"


def create_test_jwt(email: str = "test@example.com", exp_minutes: int = 30) -> str:
    """Create a valid JWT token for testing"""
    payload = {
        "sub": email,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=exp_minutes)
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm=TEST_JWT_ALGORITHM)


def create_expired_jwt(email: str = "test@example.com") -> str:
    """Create an expired JWT token for testing"""
    payload = {
        "sub": email,
        "email": email,
        "exp": datetime.utcnow() - timedelta(minutes=5)
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm=TEST_JWT_ALGORITHM)


@pytest.fixture
def auth_headers():
    """Fixture providing valid authentication headers"""
    token = create_test_jwt()
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_email_service():
    """Mock email service for integration tests"""
    with patch('app.services.email_service.email_service') as mock:
        # Configure mock to return success responses
        mock.send_email = AsyncMock(return_value=EmailResponse(
            message_id="test-msg-id",
            status="sent",
            recipient="recipient@example.com"
        ))
        mock.send_order_confirmation = AsyncMock(return_value=EmailResponse(
            message_id="order-msg-id",
            status="sent",
            recipient="customer@example.com"
        ))
        mock.send_shipping_notification = AsyncMock(return_value=EmailResponse(
            message_id="shipping-msg-id",
            status="sent",
            recipient="customer@example.com"
        ))
        mock.send_password_reset = AsyncMock(return_value=EmailResponse(
            message_id="reset-msg-id",
            status="sent",
            recipient="user@example.com"
        ))
        mock.send_welcome_email = AsyncMock(return_value=EmailResponse(
            message_id="welcome-msg-id",
            status="sent",
            recipient="newuser@example.com"
        ))
        yield mock


class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_root_health_endpoint(self):
        """GET /health should return 200 OK"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_api_health_endpoint(self):
        """GET /api/notification/health should return 200 OK"""
        response = client.get("/api/notification/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestAuthentication:
    """Test JWT authentication and authorization"""

    def test_protected_endpoint_without_token_returns_401(self):
        """Protected endpoints should return 401 without JWT token"""
        response = client.post(
            "/api/notification/test",
            headers={}
        )
        assert response.status_code == 403  # FastAPI returns 403 for missing auth

    def test_protected_endpoint_with_invalid_token_returns_401(self):
        """Protected endpoints should return 401 with invalid JWT token"""
        response = client.post(
            "/api/notification/test",
            headers={"Authorization": "Bearer invalid-token-here"}
        )
        assert response.status_code == 401

    def test_protected_endpoint_with_expired_token_returns_401(self):
        """Protected endpoints should return 401 with expired JWT token"""
        expired_token = create_expired_jwt()
        response = client.post(
            "/api/notification/test",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401

    def test_protected_endpoint_with_valid_token_returns_200(self, auth_headers):
        """Protected endpoints should succeed with valid JWT token"""
        response = client.post(
            "/api/notification/test",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["sent"] is True
        assert "user" in response.json()


class TestGenericEmailEndpoint:
    """Test POST /api/notification/email endpoint"""

    def test_send_email_with_valid_request(self, auth_headers, mock_email_service):
        """Should send email successfully with valid request"""
        email_request = {
            "to": "recipient@example.com",
            "subject": "Test Email",
            "body": "This is a test email body"
        }

        response = client.post(
            "/api/notification/email",
            json=email_request,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["recipient"] == "recipient@example.com"
        assert "message_id" in data

    def test_send_email_requires_authentication(self, mock_email_service):
        """Should reject request without authentication"""
        email_request = {
            "to": "recipient@example.com",
            "subject": "Test Email",
            "body": "This is a test email body"
        }

        response = client.post(
            "/api/notification/email",
            json=email_request
        )

        assert response.status_code == 403

    def test_send_email_with_invalid_email_returns_422(self, auth_headers):
        """Should return 422 for invalid email address"""
        email_request = {
            "to": "not-an-email",
            "subject": "Test Email",
            "body": "This is a test email body"
        }

        response = client.post(
            "/api/notification/email",
            json=email_request,
            headers=auth_headers
        )

        assert response.status_code == 422  # Pydantic validation error

    def test_send_email_with_missing_fields_returns_422(self, auth_headers):
        """Should return 422 for missing required fields"""
        email_request = {
            "to": "recipient@example.com"
            # Missing subject and body
        }

        response = client.post(
            "/api/notification/email",
            json=email_request,
            headers=auth_headers
        )

        assert response.status_code == 422


class TestOrderConfirmationEndpoint:
    """Test POST /api/notification/order-confirmation endpoint"""

    def test_send_order_confirmation_with_valid_data(self, auth_headers, mock_email_service):
        """Should send order confirmation email successfully"""
        order_data = {
            "order_id": 12345,
            "customer_name": "John Doe",
            "customer_email": "john@example.com",
            "order_total": 149.99,
            "items": [
                {"name": "Product A", "quantity": 2, "price": 49.99},
                {"name": "Product B", "quantity": 1, "price": 50.01}
            ],
            "order_date": "2026-01-17T10:30:00Z"
        }

        response = client.post(
            "/api/notification/order-confirmation",
            json=order_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert "message_id" in data

    def test_order_confirmation_requires_authentication(self, mock_email_service):
        """Should reject request without authentication"""
        order_data = {
            "order_id": 12345,
            "customer_name": "John Doe",
            "customer_email": "john@example.com",
            "order_total": 149.99,
            "items": [],
            "order_date": "2026-01-17T10:30:00Z"
        }

        response = client.post(
            "/api/notification/order-confirmation",
            json=order_data
        )

        assert response.status_code == 403


class TestShippingNotificationEndpoint:
    """Test POST /api/notification/shipping endpoint"""

    def test_send_shipping_notification_with_tracking(self, auth_headers, mock_email_service):
        """Should send shipping notification with tracking number"""
        shipping_data = {
            "order_id": 12345,
            "customer_name": "Jane Smith",
            "customer_email": "jane@example.com",
            "tracking_number": "TRACK123456",
            "estimated_delivery": "2026-01-25"
        }

        response = client.post(
            "/api/notification/shipping",
            json=shipping_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"

    def test_shipping_notification_without_tracking(self, auth_headers, mock_email_service):
        """Should send shipping notification without tracking number"""
        shipping_data = {
            "order_id": 12345,
            "customer_name": "Jane Smith",
            "customer_email": "jane@example.com"
        }

        response = client.post(
            "/api/notification/shipping",
            json=shipping_data,
            headers=auth_headers
        )

        assert response.status_code == 200


class TestPasswordResetEndpoint:
    """Test POST /api/notification/password-reset endpoint"""

    def test_send_password_reset_email(self, mock_email_service):
        """Should send password reset email (public endpoint)"""
        reset_data = {
            "email": "user@example.com",
            "reset_token": "abc123xyz",
            "reset_url": "https://shopease.io/reset?token=abc123xyz",
            "expires_in_hours": 24
        }

        response = client.post(
            "/api/notification/password-reset",
            json=reset_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["recipient"] == "user@example.com"

    def test_password_reset_with_invalid_email_returns_422(self):
        """Should return 422 for invalid email address"""
        reset_data = {
            "email": "not-an-email",
            "reset_token": "abc123xyz",
            "reset_url": "https://shopease.io/reset?token=abc123xyz"
        }

        response = client.post(
            "/api/notification/password-reset",
            json=reset_data
        )

        assert response.status_code == 422


class TestWelcomeEmailEndpoint:
    """Test POST /api/notification/welcome endpoint"""

    def test_send_welcome_email_with_verification(self, auth_headers, mock_email_service):
        """Should send welcome email with verification URL"""
        welcome_data = {
            "email": "newuser@example.com",
            "username": "newuser123",
            "verification_url": "https://shopease.io/verify?token=xyz789"
        }

        response = client.post(
            "/api/notification/welcome",
            json=welcome_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"

    def test_welcome_email_without_verification(self, auth_headers, mock_email_service):
        """Should send welcome email without verification URL"""
        welcome_data = {
            "email": "newuser@example.com",
            "username": "newuser123"
        }

        response = client.post(
            "/api/notification/welcome",
            json=welcome_data,
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_welcome_email_requires_authentication(self, mock_email_service):
        """Should reject request without authentication"""
        welcome_data = {
            "email": "newuser@example.com",
            "username": "newuser123"
        }

        response = client.post(
            "/api/notification/welcome",
            json=welcome_data
        )

        assert response.status_code == 403


class TestErrorHandling:
    """Test error handling for various failure scenarios"""

    def test_email_service_failure_returns_500(self, auth_headers):
        """Should return 500 when email service fails"""
        with patch('app.services.email_service.email_service.send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = EmailResponse(
                message_id="",
                status="failed",
                recipient="recipient@example.com"
            )

            email_request = {
                "to": "recipient@example.com",
                "subject": "Test Email",
                "body": "This is a test email body"
            }

            response = client.post(
                "/api/notification/email",
                json=email_request,
                headers=auth_headers
            )

            assert response.status_code == 500
            assert "Failed to send email" in response.json()["detail"]
