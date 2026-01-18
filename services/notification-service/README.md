# Notification Service

Email notification service for ShopEase, providing transactional emails for orders, authentication, and user onboarding.

## Features

- **Multiple Email Providers**: Console (dev), SMTP (prod), SendGrid (ready for integration)
- **Template-Based Emails**: Jinja2 templates with HTML + text versions
- **Email Types**:
  - Order Confirmation
  - Shipping Notifications
  - Password Reset
  - Welcome Emails
- **JWT Authentication**: Protected endpoints with role-based access
- **Configuration**: Environment-based settings with .env support

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Console provider (for development)
EMAIL_PROVIDER=console

# Or SMTP provider (for production)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@shopease.com
SMTP_FROM_NAME=ShopEase

# Or SendGrid provider
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@shopease.com
```

### 3. Run the Service

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --port 8003

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8003
```

## API Endpoints

### Health Check

```bash
GET /health
```

### Send Generic Email

```bash
POST /api/notification/email
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Test Email",
  "body": "This is a test email",
  "template": "welcome",  // optional
  "template_data": {}     // optional
}
```

### Send Order Confirmation

```bash
POST /api/notification/order-confirmation
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "order_id": "ORD-12345",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "order_total": 99.99,
  "order_date": "2026-01-15T10:30:00",
  "items": [
    {
      "name": "Product A",
      "sku": "SKU-001",
      "quantity": 2,
      "price": 49.99
    }
  ]
}
```

### Send Shipping Notification

```bash
POST /api/notification/shipping
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "order_id": "ORD-12345",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "tracking_number": "1Z999AA10123456784",
  "estimated_delivery": "January 20, 2026"
}
```

### Send Password Reset

```bash
POST /api/notification/password-reset
Content-Type: application/json

{
  "email": "user@example.com",
  "reset_token": "abc123xyz",
  "reset_url": "https://shopease.com/reset-password?token=abc123xyz",
  "expires_in_hours": 24
}
```

**Note**: This endpoint is public (no authentication required) for password reset flows.

### Send Welcome Email

```bash
POST /api/notification/welcome
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "verification_url": "https://shopease.com/verify?token=xyz789"
}
```

## Email Templates

Templates are located in `app/templates/`:

- `order_confirmation.html` / `order_confirmation.txt`
- `shipping_notification.html` / `shipping_notification.txt`
- `password_reset.html` / `password_reset.txt`
- `welcome.html` / `welcome.txt`

Each template uses Jinja2 syntax with variables from the corresponding Pydantic model.

## Configuration

### Email Providers

#### Console Provider (Default)
Logs emails to stdout. Perfect for development and testing.

```env
EMAIL_PROVIDER=console
```

#### SMTP Provider
Production-ready SMTP with TLS support. **Optimized for Gmail.**

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-gmail@gmail.com
SMTP_FROM_NAME=ShopEase
```

**Gmail Setup (Recommended)**:
1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select **"Mail"** as the app and **"Other"** as the device
4. Click **Generate** to get a 16-character App Password
5. Copy the App Password (without spaces) and use it as `SMTP_PASSWORD`
6. Use your full Gmail address for both `SMTP_USERNAME` and `SMTP_FROM_EMAIL`

**Important**: Never use your actual Gmail password. Always use an App Password for security.

**Gmail Sending Limits**:
- Free Gmail: 500 emails/day
- Google Workspace: 2,000 emails/day
- If you exceed limits, emails will be queued and delayed

**Other SMTP Providers**:
```env
# Microsoft 365
SMTP_HOST=smtp.office365.com
SMTP_PORT=587

# SendGrid SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587

# AWS SES
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
```

#### SendGrid Provider
Stub implementation ready for SendGrid API integration.

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@shopease.com
```

## Testing

### Unit Tests

```bash
pytest tests/ -v
```

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8003/health

# Send welcome email (requires JWT token)
curl -X POST http://localhost:8003/api/notification/welcome \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "verification_url": "http://localhost:3000/verify?token=test123"
  }'
```

### Console Output Example

When using the console provider, emails are logged like this:

```
================================================================================
SENDING EMAIL
To: test@example.com
Subject: Welcome to ShopEase!
================================================================================
[HTML BODY]
<!DOCTYPE html>
...
[TEXT BODY]
WELCOME TO SHOPEASE!
...
================================================================================
Message ID: console-12345678-1234-5678-1234-567812345678
```

## Architecture

```
Request → main.py endpoint → EmailService
                                ↓
                        TemplateService.render_template
                                ↓
                        EmailProvider.send_email
                                ↓
                    Console/SMTP/SendGrid backend
```

### Components

- **Models** (`app/models/email.py`): Pydantic data models for validation
- **Settings** (`app/config/settings.py`): Environment-based configuration
- **Email Providers** (`app/services/email_provider.py`): Pluggable email backends
- **Template Service** (`app/services/template_service.py`): Jinja2 rendering
- **Email Service** (`app/services/email_service.py`): Business logic orchestration
- **Main** (`app/main.py`): FastAPI application with REST endpoints

## Security

- **JWT Authentication**: All endpoints except `/health` and `/password-reset` require authentication
- **TLS/STARTTLS**: SMTP connections use encryption
- **Environment Variables**: Secrets stored in `.env` (not committed to git)
- **Input Validation**: Pydantic models validate all incoming data

## Integration with Other Services

### From Order Service

When an order is placed or shipped:

```python
import httpx

async def notify_order_confirmation(order_data):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://notification-service:8003/api/notification/order-confirmation",
            headers={"Authorization": f"Bearer {jwt_token}"},
            json=order_data.dict()
        )
        return response.json()
```

### From User Service

When a user registers:

```java
// Spring Boot example
RestTemplate restTemplate = new RestTemplate();
HttpHeaders headers = new HttpHeaders();
headers.setBearerAuth(jwtToken);

HttpEntity<WelcomeEmailData> request = new HttpEntity<>(emailData, headers);
ResponseEntity<EmailResponse> response = restTemplate.postForEntity(
    "http://notification-service:8003/api/notification/welcome",
    request,
    EmailResponse.class
);
```

## Observability

- **Logging**: All email operations logged with Python's logging module
- **Error Handling**: Failed emails return status "failed" with error details
- **Message IDs**: UUID-based tracking for all sent emails

## Future Enhancements

- [ ] SendGrid API integration (currently stub)
- [ ] Rate limiting for password reset endpoint
- [ ] Email queue with retry logic (RabbitMQ/Redis)
- [ ] Email delivery tracking and webhooks
- [ ] Template customization via admin UI
- [ ] A/B testing for email templates
- [ ] Internationalization (i18n) support

## License

© 2026 ShopEase. All rights reserved.
