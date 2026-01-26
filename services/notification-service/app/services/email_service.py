from typing import Dict
import logging
from datetime import datetime

from app.models.email import (
    EmailRequest,
    EmailResponse,
    OrderConfirmationData,
    ShippingNotificationData,
    PasswordResetData,
    WelcomeEmailData
)
from app.services.template_service import template_service
from app.services.email_provider import get_email_provider
from app.config.settings import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.email_provider = get_email_provider(settings)
    
    async def send_email(self, request: EmailRequest) -> EmailResponse:
        """Send generic email with optional template rendering"""
        try:
            if request.template and request.template_data:
                html_body, text_body = template_service.render_template(
                    request.template,
                    request.template_data
                )
            else:
                html_body = f"<html><body>{request.body}</body></html>"
                text_body = request.body
            
            result = await self.email_provider.send_email(
                to=request.to,
                subject=request.subject,
                html_body=html_body,
                text_body=text_body
            )
            
            return EmailResponse(
                message_id=result.get("message_id", "unknown"),
                status=result.get("status", "failed"),
                recipient=request.to
            )
        except Exception as e:
            logger.error(f"Failed to send email to {request.to}: {str(e)}")
            return EmailResponse(
                message_id="error",
                status="failed",
                recipient=request.to
            )
    
    async def send_order_confirmation(self, data: OrderConfirmationData) -> EmailResponse:
        """Send order confirmation email"""
        try:
            html_body, text_body = template_service.render_template(
                "order_confirmation",
                {
                    "customer_name": data.customer_name,
                    "order_id": data.order_id,
                    "order_date": data.order_date.strftime("%B %d, %Y") if isinstance(data.order_date, datetime) else data.order_date,
                    "order_total": data.order_total,
                    "items": data.items
                }
            )
            
            result = await self.email_provider.send_email(
                to=data.customer_email,
                subject=f"Order Confirmation - #{data.order_id}",
                html_body=html_body,
                text_body=text_body
            )
            
            return EmailResponse(
                message_id=result.get("message_id", "unknown"),
                status=result.get("status", "failed"),
                recipient=data.customer_email
            )
        except Exception as e:
            logger.error(f"Failed to send order confirmation to {data.customer_email}: {str(e)}")
            return EmailResponse(
                message_id="error",
                status="failed",
                recipient=data.customer_email
            )
    
    async def send_shipping_notification(self, data: ShippingNotificationData) -> EmailResponse:
        """Send shipping notification email"""
        try:
            html_body, text_body = template_service.render_template(
                "shipping_notification",
                {
                    "customer_name": data.customer_name,
                    "order_id": data.order_id,
                    "tracking_number": data.tracking_number,
                    "estimated_delivery": data.estimated_delivery
                }
            )
            
            result = await self.email_provider.send_email(
                to=data.customer_email,
                subject=f"Your Order #{data.order_id} Has Shipped!",
                html_body=html_body,
                text_body=text_body
            )
            
            return EmailResponse(
                message_id=result.get("message_id", "unknown"),
                status=result.get("status", "failed"),
                recipient=data.customer_email
            )
        except Exception as e:
            logger.error(f"Failed to send shipping notification to {data.customer_email}: {str(e)}")
            return EmailResponse(
                message_id="error",
                status="failed",
                recipient=data.customer_email
            )
    
    async def send_password_reset(self, data: PasswordResetData) -> EmailResponse:
        """Send password reset email"""
        try:
            html_body, text_body = template_service.render_template(
                "password_reset",
                {
                    "email": data.email,
                    "reset_url": data.reset_url,
                    "reset_token": data.reset_token,
                    "expires_in_hours": data.expires_in_hours
                }
            )
            
            result = await self.email_provider.send_email(
                to=data.email,
                subject="Password Reset Request",
                html_body=html_body,
                text_body=text_body
            )
            
            return EmailResponse(
                message_id=result.get("message_id", "unknown"),
                status=result.get("status", "failed"),
                recipient=data.email
            )
        except Exception as e:
            logger.error(f"Failed to send password reset to {data.email}: {str(e)}")
            return EmailResponse(
                message_id="error",
                status="failed",
                recipient=data.email
            )
    
    async def send_welcome_email(self, data: WelcomeEmailData) -> EmailResponse:
        """Send welcome email"""
        try:
            html_body, text_body = template_service.render_template(
                "welcome",
                {
                    "email": data.email,
                    "username": data.username,
                    "verification_url": data.verification_url
                }
            )
            
            result = await self.email_provider.send_email(
                to=data.email,
                subject="Welcome to ShopEase!",
                html_body=html_body,
                text_body=text_body
            )
            
            return EmailResponse(
                message_id=result.get("message_id", "unknown"),
                status=result.get("status", "failed"),
                recipient=data.email
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email to {data.email}: {str(e)}")
            return EmailResponse(
                message_id="error",
                status="failed",
                recipient=data.email
            )


email_service = EmailService()
