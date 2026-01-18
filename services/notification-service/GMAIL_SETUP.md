# Gmail Setup Guide for ShopEase Notification Service

This service is optimized for Gmail's SMTP server. Follow these steps to configure Gmail as your email provider.

## Prerequisites

- A Gmail account or Google Workspace account
- 2-Factor Authentication enabled

## Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2FA (required for App Passwords)

## Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Sign in if prompted
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Enter "ShopEase Notification Service" as the name
6. Click **Generate**
7. Copy the 16-character password (without spaces)

**Example App Password format:** `abcd efgh ijkl mnop`

## Step 3: Configure Environment

Create a `.env` file in the notification-service directory:

```bash
cp .env.example .env
```

Edit `.env` with your Gmail credentials:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your.email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM_EMAIL=your.email@gmail.com
SMTP_FROM_NAME=ShopEase
FRONTEND_URL=http://localhost:3000
```

**Important:**
- Replace `your.email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with your App Password (remove spaces)
- Use the **same email** for both `SMTP_USERNAME` and `SMTP_FROM_EMAIL`

## Step 4: Test the Configuration

Start the service:

```bash
uvicorn app.main:app --reload --port 8003
```

Send a test email:

```bash
curl -X POST http://localhost:8003/api/notification/welcome \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com",
    "username": "testuser",
    "verification_url": "http://localhost:3000/verify?token=test123"
  }'
```

Check your inbox (and spam folder) for the welcome email.

## Gmail Sending Limits

| Account Type | Daily Limit | Hourly Limit |
|--------------|-------------|--------------|
| Free Gmail | 500 emails | ~50 emails |
| Google Workspace | 2,000 emails | ~100 emails |

If you exceed limits:
- Emails will be queued by Gmail
- You'll see "Message sending quota exceeded" errors
- Wait 24 hours for the limit to reset

## Troubleshooting

### Error: "Username and Password not accepted"

**Causes:**
- Using your regular Gmail password instead of App Password
- App Password has spaces in it
- 2FA not enabled

**Solutions:**
1. Generate a new App Password
2. Copy it **without spaces**: `abcdefghijklmnop`
3. Ensure 2FA is enabled on your account

### Error: "smtplib.SMTPAuthenticationError: 535-5.7.8 Username and Password not accepted"

**Solution:** You're using your regular password. Generate an App Password:
1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate new App Password
3. Use that password in `.env`

### Error: "Connection timed out"

**Causes:**
- Firewall blocking port 587
- Network restrictions

**Solutions:**
1. Check firewall allows outbound connections on port 587
2. Try from a different network
3. Contact your IT department if on corporate network

### Emails going to spam

**Solutions:**
1. **Use your actual Gmail address** for `SMTP_FROM_EMAIL` (not noreply@shopease.com)
2. Set up SPF records if using custom domain
3. Warm up your sending pattern (start with low volume)
4. Ask recipients to add your email to contacts

### Error: "Daily sending quota exceeded"

**Solutions:**
1. Wait 24 hours for quota reset
2. Upgrade to Google Workspace for higher limits
3. Implement email queuing to spread sends over time
4. Use SendGrid or AWS SES for high-volume sending

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` by default
2. **Use App Passwords only** - Never use your account password
3. **Rotate App Passwords regularly** - Generate new ones periodically
4. **Revoke unused App Passwords** - Delete old ones from Google Account
5. **Monitor Gmail activity** - Check [Recent Activity](https://myaccount.google.com/notifications) regularly

## Alternative: Gmail API

For higher sending limits and better deliverability, consider using Gmail API instead of SMTP:

**Benefits:**
- Higher sending limits
- Better OAuth2 authentication
- More detailed error messages
- Ability to read sent mail status

**Drawback:** Requires more complex OAuth2 setup

## Support

If you continue having issues:
1. Check [Gmail SMTP settings](https://support.google.com/mail/answer/7126229)
2. Review [Less secure apps](https://support.google.com/accounts/answer/6010255) (deprecated, use App Passwords)
3. Check service logs: `journalctl -u notification-service -f`

## Production Recommendations

For production use with Gmail:
1. Use Google Workspace (higher limits)
2. Set up SPF/DKIM records for your domain
3. Implement email queuing with Redis/RabbitMQ
4. Monitor sending quotas
5. Have fallback to alternative provider (SendGrid, AWS SES)

---

**Last Updated:** January 17, 2026  
**Service Version:** 0.1.0
