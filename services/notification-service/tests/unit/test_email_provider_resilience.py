"""
Resilience tests for EmailProvider implementations and EmailService fallback behaviour.

Tests validate that:
- SMTPEmailProvider returns status="failed" on connection timeout
- SMTPEmailProvider returns status="failed" on connection refused
- SMTPEmailProvider returns status="failed" on authentication failure
- EmailService wraps provider exceptions into a safe EmailResponse(status="failed")
- ConsoleEmailProvider generates a unique message_id on every call
- SendGridEmailProvider (stub) always returns status="sent"
"""

import socket
import smtplib
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.email_provider import (
    SMTPEmailProvider,
    ConsoleEmailProvider,
    SendGridEmailProvider,
)
from app.services.email_service import EmailService
from app.models.email import EmailRequest


# ---------------------------------------------------------------------------
# SMTPEmailProvider resilience
# ---------------------------------------------------------------------------

class TestSMTPEmailProviderResilience:
    """Test SMTP provider behaviour when the mail server is unavailable or misbehaves."""

    def _make_provider(self) -> SMTPEmailProvider:
        return SMTPEmailProvider(
            host="mail.example.invalid",
            port=587,
            username="user@example.invalid",
            password="secret",
            from_email="noreply@example.invalid",
            from_name="ShopEase",
        )

    @pytest.mark.asyncio
    async def test_connection_timeout_returns_failed_status(self):
        """When smtplib.SMTP raises socket.timeout, the provider must return status='failed'."""
        provider = self._make_provider()

        with patch("smtplib.SMTP", side_effect=socket.timeout("Connection timed out")):
            result = await provider.send_email(
                to="customer@example.com",
                subject="Order Confirmation",
                html_body="<p>Your order is confirmed.</p>",
            )

        assert result["status"] == "failed"
        assert result["recipient"] == "customer@example.com"
        assert "error" in result
        assert "timed out" in result["error"].lower() or "timeout" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_connection_refused_returns_failed_status(self):
        """When the SMTP server refuses the connection, the provider must return status='failed'."""
        provider = self._make_provider()

        with patch("smtplib.SMTP", side_effect=ConnectionRefusedError("Connection refused")):
            result = await provider.send_email(
                to="customer@example.com",
                subject="Password Reset",
                html_body="<p>Reset your password.</p>",
            )

        assert result["status"] == "failed"
        assert "error" in result

    @pytest.mark.asyncio
    async def test_authentication_failure_returns_failed_status(self):
        """When SMTP login fails (wrong credentials), the provider must return status='failed'."""
        provider = self._make_provider()

        mock_server = MagicMock()
        mock_server.__enter__ = MagicMock(return_value=mock_server)
        mock_server.__exit__ = MagicMock(return_value=False)
        mock_server.ehlo = MagicMock()
        mock_server.starttls = MagicMock()
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(
            535, b"Authentication credentials invalid"
        )

        with patch("smtplib.SMTP", return_value=mock_server):
            result = await provider.send_email(
                to="user@example.com",
                subject="Welcome",
                html_body="<p>Welcome to ShopEase!</p>",
            )

        assert result["status"] == "failed"
        assert "error" in result

    @pytest.mark.asyncio
    async def test_send_failure_mid_session_returns_failed_status(self):
        """When send_message raises after a successful login, the provider returns status='failed'."""
        provider = self._make_provider()

        mock_server = MagicMock()
        mock_server.__enter__ = MagicMock(return_value=mock_server)
        mock_server.__exit__ = MagicMock(return_value=False)
        mock_server.ehlo = MagicMock()
        mock_server.starttls = MagicMock()
        mock_server.login = MagicMock()
        mock_server.send_message.side_effect = smtplib.SMTPException("Unexpected server error")

        with patch("smtplib.SMTP", return_value=mock_server):
            result = await provider.send_email(
                to="admin@example.com",
                subject="Notification",
                html_body="<p>System update.</p>",
            )

        assert result["status"] == "failed"
        assert "error" in result


# ---------------------------------------------------------------------------
# EmailService resilience
# ---------------------------------------------------------------------------

class TestEmailServiceProviderFallback:
    """Test that EmailService wraps any provider exception into a safe failed response."""

    @pytest.mark.asyncio
    async def test_provider_exception_returns_failed_email_response(self):
        """If the underlying email provider raises, EmailService returns status='failed'."""
        failing_provider = AsyncMock()
        failing_provider.send_email.side_effect = RuntimeError("Downstream provider is down")

        with patch("app.services.email_service.get_email_provider", return_value=failing_provider), \
             patch("app.services.email_service.template_service") as mock_tmpl:
            mock_tmpl.render_template.return_value = ("<p>Hello</p>", "Hello")
            service = EmailService()

        # Reinitialise with the failing provider by patching at instance level
        service.email_provider = failing_provider

        request = EmailRequest(
            to="test@example.com",
            subject="Test",
            body="Test body",
        )
        result = await service.send_email(request)

        assert result.status == "failed"
        assert result.recipient == "test@example.com"
        assert result.message_id == "error"

    @pytest.mark.asyncio
    async def test_provider_returns_failed_status_is_forwarded(self):
        """When the provider itself returns status='failed', EmailService preserves that."""
        provider_returning_failed = AsyncMock()
        provider_returning_failed.send_email.return_value = {
            "message_id": "smtp-xxx",
            "status": "failed",
            "recipient": "user@example.com",
            "error": "SMTP server timeout",
        }

        with patch("app.services.email_service.get_email_provider", return_value=provider_returning_failed):
            service = EmailService()

        service.email_provider = provider_returning_failed
        request = EmailRequest(to="user@example.com", subject="Retry", body="Body")
        result = await service.send_email(request)

        assert result.status == "failed"
        assert result.recipient == "user@example.com"


# ---------------------------------------------------------------------------
# ConsoleEmailProvider uniqueness
# ---------------------------------------------------------------------------

class TestConsoleEmailProviderUniqueness:
    """Verify that every call to ConsoleEmailProvider produces a unique message_id."""

    @pytest.mark.asyncio
    async def test_consecutive_sends_produce_unique_message_ids(self):
        """Each send must generate a distinct message_id — no collisions on rapid calls."""
        provider = ConsoleEmailProvider()
        ids = set()

        with patch("app.services.email_provider.logger"):
            for i in range(10):
                result = await provider.send_email(
                    to=f"user{i}@example.com",
                    subject="Batch send",
                    html_body=f"<p>Message {i}</p>",
                )
                assert result["status"] == "sent"
                ids.add(result["message_id"])

        assert len(ids) == 10, "Expected 10 unique message_ids, got duplicates"

    @pytest.mark.asyncio
    async def test_message_id_has_console_prefix(self):
        """ConsoleEmailProvider message_ids must carry the 'console-' namespace prefix."""
        provider = ConsoleEmailProvider()

        with patch("app.services.email_provider.logger"):
            result = await provider.send_email(
                to="test@example.com",
                subject="Prefix check",
                html_body="<p>Hello</p>",
            )

        assert result["message_id"].startswith("console-")


# ---------------------------------------------------------------------------
# SendGridEmailProvider stub
# ---------------------------------------------------------------------------

class TestSendGridEmailProviderStub:
    """Verify the SendGrid stub provider always returns a successful response."""

    @pytest.mark.asyncio
    async def test_always_returns_sent_status(self):
        """SendGrid stub never actually calls the API but must return status='sent'."""
        provider = SendGridEmailProvider(
            api_key="SG.fake-api-key",
            from_email="noreply@shopease.io",
        )
        result = await provider.send_email(
            to="customer@example.com",
            subject="Order shipped",
            html_body="<p>Your order is on the way!</p>",
        )

        assert result["status"] == "sent"
        assert result["recipient"] == "customer@example.com"
        assert result["message_id"].startswith("sendgrid-")
        assert result.get("provider") == "sendgrid"

    @pytest.mark.asyncio
    async def test_returns_unique_message_ids(self):
        """SendGrid stub should return a unique message_id on each call."""
        provider = SendGridEmailProvider(api_key="SG.key", from_email="no@example.com")
        ids = {
            (await provider.send_email(to="a@b.com", subject="s", html_body="<p>h</p>"))["message_id"]
            for _ in range(5)
        }
        assert len(ids) == 5
