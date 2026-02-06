"""
Unit tests for EmailService

Tests business logic of email sending methods in isolation from HTTP layer
and email provider implementations. Uses mocked dependencies.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.email_service import EmailService
from app.models.email import (
    EmailRequest,
    OrderConfirmationData,
    ShippingNotificationData,
    PasswordResetData,
    WelcomeEmailData,
    EmailResponse
)


class TestEmailServiceSendEmail:
    """Test send_email method with template rendering"""
    
    @pytest.mark.asyncio
    async def test_send_email_with_template_success(self):
        """Should render template and send email successfully"""
        # Arrange
        email_request = EmailRequest(
            to="test@example.com",
            subject="Test Subject",
            body="Test body",
            template="test_template",
            template_data={"key": "value"}
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.return_value = {
            "message_id": "msg-123",
            "status": "sent"
        }
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.return_value = (
                "<html>Test HTML</html>",
                "Test Text"
            )
            
            service = EmailService()
            
            # Act
            result = await service.send_email(email_request)
            
            # Assert
            assert result.message_id == "msg-123"
            assert result.status == "sent"
            assert result.recipient == "test@example.com"
            
            mock_template.render_template.assert_called_once_with(
                "test_template",
                {"key": "value"}
            )
            
            mock_provider.send_email.assert_called_once_with(
                to="test@example.com",
                subject="Test Subject",
                html_body="<html>Test HTML</html>",
                text_body="Test Text"
            )
    
    @pytest.mark.asyncio
    async def test_send_email_without_template(self):
        """Should send plain body email without template rendering"""
        # Arrange
        email_request = EmailRequest(
            to="test@example.com",
            subject="Plain Email",
            body="Plain text body"
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.return_value = {
            "message_id": "msg-456",
            "status": "sent"
        }
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            service = EmailService()
            
            # Act
            result = await service.send_email(email_request)
            
            # Assert
            assert result.message_id == "msg-456"
            assert result.status == "sent"
            assert result.recipient == "test@example.com"
            
            mock_template.render_template.assert_not_called()
            
            mock_provider.send_email.assert_called_once_with(
                to="test@example.com",
                subject="Plain Email",
                html_body="<html><body>Plain text body</body></html>",
                text_body="Plain text body"
            )
    
    @pytest.mark.asyncio
    async def test_send_email_template_error_handling(self):
        """Should handle template rendering errors gracefully"""
        # Arrange
        email_request = EmailRequest(
            to="test@example.com",
            subject="Test",
            body="Test",
            template="missing_template",
            template_data={}
        )
        
        mock_provider = AsyncMock()
        
        # Mock both template service and provider
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.side_effect = Exception("Template not found")
            
            service = EmailService()
            
            # Act
            result = await service.send_email(email_request)
            
            # Assert
            assert result.message_id == "error"
            assert result.status == "failed"
            assert result.recipient == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_send_email_provider_error_handling(self):
        """Should handle email provider errors gracefully"""
        # Arrange
        email_request = EmailRequest(
            to="test@example.com",
            subject="Test",
            body="Test body"
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.side_effect = Exception("SMTP connection failed")
        
        with patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            service = EmailService()
            
            # Act
            result = await service.send_email(email_request)
            
            # Assert
            assert result.message_id == "error"
            assert result.status == "failed"
            assert result.recipient == "test@example.com"


class TestEmailServiceOrderConfirmation:
    """Test send_order_confirmation method"""
    
    @pytest.mark.asyncio
    async def test_send_order_confirmation_success(self):
        """Should format order data and send confirmation email"""
        # Arrange
        order_data = OrderConfirmationData(
            customer_email="customer@example.com",
            customer_name="John Doe",
            order_id="ORD-12345",
            order_date="2024-01-15T10:30:00Z",
            order_total=159.99,
            items=[
                {"name": "Product A", "quantity": 2, "price": 49.99},
                {"name": "Product B", "quantity": 1, "price": 60.01}
            ]
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.return_value = {
            "message_id": "order-123",
            "status": "sent"
        }
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.return_value = (
                "<html>Order Confirmation</html>",
                "Order Confirmation"
            )
            
            service = EmailService()
            
            # Act
            result = await service.send_order_confirmation(order_data)
            
            # Assert
            assert result.message_id == "order-123"
            assert result.status == "sent"
            assert result.recipient == "customer@example.com"
            
            call_args = mock_template.render_template.call_args
            assert call_args[0][0] == "order_confirmation"
            
            context = call_args[0][1]
            assert context["customer_name"] == "John Doe"
            assert context["order_id"] == "ORD-12345"
            assert context["order_total"] == 159.99
            assert len(context["items"]) == 2
    
    @pytest.mark.asyncio
    async def test_send_order_confirmation_error_handling(self):
        """Should handle errors when sending order confirmation"""
        # Arrange
        order_data = OrderConfirmationData(
            customer_email="customer@example.com",
            customer_name="John Doe",
            order_id="ORD-12345",
            order_date="2024-01-15T10:30:00Z",
            order_total=100.00,
            items=[]
        )
        
        mock_provider = AsyncMock()
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.side_effect = Exception("Template error")
            
            service = EmailService()
            
            # Act
            result = await service.send_order_confirmation(order_data)
            
            # Assert
            assert result.status == "failed"
            assert result.recipient == "customer@example.com"


class TestEmailServiceShippingNotification:
    """Test send_shipping_notification method"""
    
    @pytest.mark.asyncio
    async def test_send_shipping_notification_success(self):
        """Should send shipping notification with tracking information"""
        # Arrange
        shipping_data = ShippingNotificationData(
            customer_email="customer@example.com",
            customer_name="Jane Smith",
            order_id="ORD-67890",
            tracking_number="TRACK-ABC123",
            estimated_delivery="2024-01-20"
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.return_value = {
            "message_id": "ship-456",
            "status": "sent"
        }
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.return_value = (
                "<html>Shipping Notice</html>",
                "Shipping Notice"
            )
            
            service = EmailService()
            
            # Act
            result = await service.send_shipping_notification(shipping_data)
            
            # Assert
            assert result.message_id == "ship-456"
            assert result.status == "sent"
            assert result.recipient == "customer@example.com"
            
            call_args = mock_template.render_template.call_args
            context = call_args[0][1]
            assert context["tracking_number"] == "TRACK-ABC123"
            assert context["estimated_delivery"] == "2024-01-20"


class TestEmailServicePasswordReset:
    """Test send_password_reset method"""
    
    @pytest.mark.asyncio
    async def test_send_password_reset_success(self):
        """Should send password reset email with reset link"""
        # Arrange
        reset_data = PasswordResetData(
            email="user@example.com",
            reset_url="https://example.com/reset?token=abc123",
            reset_token="abc123",
            expires_in_hours=24
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.return_value = {
            "message_id": "reset-789",
            "status": "sent"
        }
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.return_value = (
                "<html>Password Reset</html>",
                "Password Reset"
            )
            
            service = EmailService()
            
            # Act
            result = await service.send_password_reset(reset_data)
            
            # Assert
            assert result.message_id == "reset-789"
            assert result.status == "sent"
            assert result.recipient == "user@example.com"
            
            call_args = mock_template.render_template.call_args
            context = call_args[0][1]
            assert context["reset_url"] == "https://example.com/reset?token=abc123"
            assert context["expires_in_hours"] == 24


class TestEmailServiceWelcomeEmail:
    """Test send_welcome_email method"""
    
    @pytest.mark.asyncio
    async def test_send_welcome_email_success(self):
        """Should send welcome email with verification link"""
        # Arrange
        welcome_data = WelcomeEmailData(
            email="newuser@example.com",
            username="newuser",
            verification_url="https://example.com/verify?token=xyz789"
        )
        
        mock_provider = AsyncMock()
        mock_provider.send_email.return_value = {
            "message_id": "welcome-111",
            "status": "sent"
        }
        
        with patch('app.services.email_service.template_service') as mock_template, \
             patch('app.services.email_service.get_email_provider', return_value=mock_provider):
            
            mock_template.render_template.return_value = (
                "<html>Welcome</html>",
                "Welcome"
            )
            
            service = EmailService()
            
            # Act
            result = await service.send_welcome_email(welcome_data)
            
            # Assert
            assert result.message_id == "welcome-111"
            assert result.status == "sent"
            assert result.recipient == "newuser@example.com"
            
            call_args = mock_template.render_template.call_args
            context = call_args[0][1]
            assert context["username"] == "newuser"
            assert context["verification_url"] == "https://example.com/verify?token=xyz789"
