from abc import ABC, abstractmethod
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)

class EmailProvider(ABC):
    @abstractmethod
    async def send_email(
        self, 
        to: str, 
        subject: str, 
        html_body: str, 
        text_body: Optional[str] = None
    ) -> dict:
        pass

class ConsoleEmailProvider(EmailProvider):
    """Console email provider for development/testing"""
    
    async def send_email(
        self, 
        to: str, 
        subject: str, 
        html_body: str, 
        text_body: Optional[str] = None
    ) -> dict:
        message_id = f"console-{uuid.uuid4()}"
        logger.info(f"=== EMAIL SENT (Console) ===")
        logger.info(f"To: {to}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Message ID: {message_id}")
        logger.info(f"Body:\n{text_body or html_body}")
        logger.info("=" * 50)
        
        return {
            "message_id": message_id,
            "status": "sent",
            "recipient": to
        }

class SMTPEmailProvider(EmailProvider):
    """SMTP email provider"""
    
    def __init__(self, host: str, port: int, username: str, password: str, from_email: str, from_name: str):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.from_name = from_name
    
    async def send_email(
        self, 
        to: str, 
        subject: str, 
        html_body: str, 
        text_body: Optional[str] = None
    ) -> dict:
        import smtplib
        import ssl
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        message_id = f"smtp-{uuid.uuid4()}"
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{self.from_name} <{self.from_email}>"
        msg['To'] = to
        msg['Message-ID'] = message_id
        
        if text_body:
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        try:
            # Create secure SSL context for Gmail compatibility
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.host, self.port, timeout=30) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"Email sent via SMTP to {to}, message_id: {message_id}")
            return {
                "message_id": message_id,
                "status": "sent",
                "recipient": to
            }
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {str(e)}")
            return {
                "message_id": message_id,
                "status": "failed",
                "recipient": to,
                "error": str(e)
            }

class SendGridEmailProvider(EmailProvider):
    """SendGrid email provider (stub for now)"""
    
    def __init__(self, api_key: str, from_email: str):
        self.api_key = api_key
        self.from_email = from_email
    
    async def send_email(
        self, 
        to: str, 
        subject: str, 
        html_body: str, 
        text_body: Optional[str] = None
    ) -> dict:
        message_id = f"sendgrid-{uuid.uuid4()}"
        logger.info(f"SendGrid email would be sent to {to} (stub implementation)")
        
        return {
            "message_id": message_id,
            "status": "sent",
            "recipient": to,
            "provider": "sendgrid"
        }

def get_email_provider(settings) -> EmailProvider:
    provider_type = settings.email_provider.lower()
    
    if provider_type == "smtp":
        return SMTPEmailProvider(
            host=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            from_email=settings.smtp_from_email,
            from_name=settings.smtp_from_name
        )
    elif provider_type == "sendgrid":
        return SendGridEmailProvider(
            api_key=settings.sendgrid_api_key,
            from_email=settings.sendgrid_from_email
        )
    else:
        return ConsoleEmailProvider()
