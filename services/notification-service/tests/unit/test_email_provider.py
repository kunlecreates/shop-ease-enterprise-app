"""Unit tests for EmailProvider implementations."""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.email_provider import (
    ConsoleEmailProvider,
    SMTPEmailProvider,
    SendGridEmailProvider,
    get_email_provider
)


class TestConsoleEmailProvider:
    """Test ConsoleEmailProvider"""
    
    @pytest.mark.asyncio
    async def test_send_email_logs_to_console(self):
        """Should log email details to console"""
        # Arrange
        provider = ConsoleEmailProvider()
        
        with patch('app.services.email_provider.logger') as mock_logger:
            # Act
            result = await provider.send_email(
                to="test@example.com",
                subject="Test Subject",
                html_body="<html>Test HTML</html>",
                text_body="Test Text"
            )
            
            # Assert - should log to console
            assert mock_logger.info.called
            # Check that email details were logged
            log_calls = [str(call) for call in mock_logger.info.call_args_list]
            assert any("test@example.com" in str(call) for call in log_calls)
            assert any("Test Subject" in str(call) for call in log_calls)
    
    @pytest.mark.asyncio
    async def test_send_email_returns_success_response(self):
        """Should return success response with message_id"""
        # Arrange
        provider = ConsoleEmailProvider()
        
        with patch('app.services.email_provider.logger'):
            # Act
            result = await provider.send_email(
                to="user@example.com",
                subject="Hello",
                html_body="<p>World</p>"
            )
            
            # Assert
            assert result["status"] == "sent"
            assert result["recipient"] == "user@example.com"
            assert "message_id" in result
            assert result["message_id"].startswith("console-")
    
    @pytest.mark.asyncio
    async def test_send_email_with_optional_text_body(self):
        """Should handle optional text_body parameter"""
        # Arrange
        provider = ConsoleEmailProvider()
        
        with patch('app.services.email_provider.logger'):
            # Act
            result = await provider.send_email(
                to="user@example.com",
                subject="Hello",
                html_body="<p>HTML only</p>",
                text_body=None
            )
            
            # Assert
            assert result["status"] == "sent"
            assert result["recipient"] == "user@example.com"


class TestSMTPEmailProvider:
    """Test SMTPEmailProvider"""
    
    @pytest.mark.asyncio
    async def test_send_email_success(self):
        """Should successfully send email via SMTP"""
        provider = SMTPEmailProvider(
            host="smtp.gmail.com",
            port=587,
            username="sender@gmail.com",
            password="secret123",
            from_email="sender@gmail.com",
            from_name="Sender Name"
        )

        smtp_client = MagicMock()
        smtp_context = MagicMock()
        smtp_context.__enter__.return_value = smtp_client
        smtp_context.__exit__.return_value = None

        with patch('smtplib.SMTP', return_value=smtp_context), \
             patch('ssl.create_default_context', return_value='ssl-context'), \
             patch('app.services.email_provider.logger'):

            result = await provider.send_email(
                to="recipient@example.com",
                subject="Test",
                html_body="<p>Test</p>",
                text_body="Plain text"
            )

            assert result["status"] == "sent"
            assert result["recipient"] == "recipient@example.com"
            smtp_client.starttls.assert_called_once_with(context='ssl-context')
            smtp_client.login.assert_called_once_with("sender@gmail.com", "secret123")
            smtp_client.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_skips_login_when_credentials_are_blank(self):
        """Should not call login when SMTP credentials are empty"""
        provider = SMTPEmailProvider(
            host="smtp.example.com",
            port=587,
            username="",
            password="",
            from_email="sender@example.com",
            from_name="Sender"
        )

        smtp_client = MagicMock()
        smtp_context = MagicMock()
        smtp_context.__enter__.return_value = smtp_client
        smtp_context.__exit__.return_value = None

        with patch('smtplib.SMTP', return_value=smtp_context), \
             patch('ssl.create_default_context', return_value='ssl-context'), \
             patch('app.services.email_provider.logger'):

            result = await provider.send_email(
                to="recipient@example.com",
                subject="No Login",
                html_body="<p>Test</p>"
            )

            assert result["status"] == "sent"
            smtp_client.login.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_send_email_error_handling(self):
        """Should handle SMTP errors gracefully"""
        # Arrange
        provider = SMTPEmailProvider(
            host="invalid-host.example.com",
            port=587,
            username="sender@gmail.com",
            password="secret",
            from_email="sender@gmail.com",
            from_name="Sender"
        )
        
        with patch('app.services.email_provider.logger'):
            # Act - calling with invalid host should fail gracefully
            result = await provider.send_email(
                to="recipient@example.com",
                subject="Test",
                html_body="<p>Test</p>"
            )
            
            # Assert - should return failed status when unable to connect
            assert result["status"] == "failed"
            assert "message_id" in result


class TestSendGridEmailProvider:
    """Test SendGridEmailProvider stub"""
    
    @pytest.mark.asyncio
    async def test_send_email_returns_stub_response(self):
        """Should return stub response indicating SendGrid would be called"""
        # Arrange
        provider = SendGridEmailProvider(
            api_key="sg-key-123",
            from_email="sender@example.com"
        )
        
        with patch('app.services.email_provider.logger'):
            # Act
            result = await provider.send_email(
                to="recipient@example.com",
                subject="Test",
                html_body="<p>Test</p>"
            )
            
            # Assert
            assert result["status"] == "sent"
            assert result["provider"] == "sendgrid"
            assert result["message_id"].startswith("sendgrid-")


class TestGetEmailProvider:
    """Test get_email_provider factory function"""
    
    def test_get_email_provider_returns_console_by_default(self):
        """Should return ConsoleEmailProvider when provider not specified"""
        # Arrange
        mock_settings = Mock()
        mock_settings.email_provider = "unknown"
        
        # Act
        provider = get_email_provider(mock_settings)
        
        # Assert
        assert isinstance(provider, ConsoleEmailProvider)
    
    def test_get_email_provider_returns_smtp(self):
        """Should return SMTPEmailProvider when provider is smtp"""
        # Arrange
        mock_settings = Mock()
        mock_settings.email_provider = "smtp"
        mock_settings.smtp_host = "smtp.gmail.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@gmail.com"
        mock_settings.smtp_password = "password"
        mock_settings.smtp_from_email = "from@gmail.com"
        mock_settings.smtp_from_name = "From Name"
        
        # Act
        provider = get_email_provider(mock_settings)
        
        # Assert
        assert isinstance(provider, SMTPEmailProvider)
    
    def test_get_email_provider_returns_sendgrid(self):
        """Should return SendGridEmailProvider when provider is sendgrid"""
        # Arrange
        mock_settings = Mock()
        mock_settings.email_provider = "sendgrid"
        mock_settings.sendgrid_api_key = "sg-key"
        mock_settings.sendgrid_from_email = "from@example.com"
        
        # Act
        provider = get_email_provider(mock_settings)
        
        # Assert
        assert isinstance(provider, SendGridEmailProvider)

    def test_get_email_provider_normalizes_provider_name_case(self):
        """Should resolve providers case-insensitively"""
        mock_settings = Mock()
        mock_settings.email_provider = "SMTP"
        mock_settings.smtp_host = "smtp.gmail.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@gmail.com"
        mock_settings.smtp_password = "password"
        mock_settings.smtp_from_email = "from@gmail.com"
        mock_settings.smtp_from_name = "From Name"

        provider = get_email_provider(mock_settings)

        assert isinstance(provider, SMTPEmailProvider)
