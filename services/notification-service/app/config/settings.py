import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Notification Service"
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-changeme")
    
    # Email provider settings
    email_provider: str = os.getenv("EMAIL_PROVIDER", "console")  # console, smtp, sendgrid
    
    # SMTP settings
    smtp_host: str = os.getenv("SMTP_HOST", "localhost")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "noreply@shopease.com")
    smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "ShopEase")
    
    # SendGrid settings
    sendgrid_api_key: str = os.getenv("SENDGRID_API_KEY", "")
    sendgrid_from_email: str = os.getenv("SENDGRID_FROM_EMAIL", "noreply@shopease.com")
    
    # Application URLs
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    class Config:
        env_file = ".env"

settings = Settings()
