import { notificationHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

describe('Notification Email Contract', () => {
  let adminToken: string;

  beforeAll(async () => {
    const { token } = await adminLogin();
    adminToken = token;
  });

  test('POST /api/notification/order-confirmation - send order confirmation email', async () => {
    const orderData = {
      orderId: 'ORD-TEST-001',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      items: [
        { productName: 'Test Product', quantity: 2, price: 1999 }
      ],
      total: 3998,
      orderDate: new Date().toISOString()
    };

    const resp = await notificationHttp.post('/api/notification/order-confirmation', orderData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect([200, 202]).toContain(resp.status);
    expect(resp.data).toHaveProperty('success', true);
  });

  test('POST /api/notification/shipping - send shipping notification', async () => {
    const shippingData = {
      orderId: 'ORD-TEST-002',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      trackingNumber: '1Z999AA10123456784',
      estimatedDelivery: '2026-01-25'
    };

    const resp = await notificationHttp.post('/api/notification/shipping', shippingData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect([200, 202]).toContain(resp.status);
    expect(resp.data).toHaveProperty('success', true);
  });

  test('POST /api/notification/welcome - send welcome email', async () => {
    const welcomeData = {
      email: 'newuser@example.com',
      username: 'newuser',
      verificationUrl: 'https://shop.kunlecreates.org/verify?token=xyz789'
    };

    const resp = await notificationHttp.post('/api/notification/welcome', welcomeData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect([200, 202]).toContain(resp.status);
    expect(resp.data).toHaveProperty('success', true);
  });

  test('POST /api/notification/password-reset - send password reset email', async () => {
    const resetData = {
      email: 'user@example.com',
      resetToken: 'abc123xyz',
      resetUrl: 'https://shop.kunlecreates.org/reset-password?token=abc123xyz',
      expiresInHours: 24
    };

    const resp = await notificationHttp.post('/api/notification/password-reset', resetData);

    expect([200, 202]).toContain(resp.status);
    expect(resp.data).toHaveProperty('success', true);
  });

  test('POST /api/notification/email - generic email sending', async () => {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'This is a test email',
      template: 'generic'
    };

    const resp = await notificationHttp.post('/api/notification/email', emailData, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 202, 400]).toContain(resp.status);
    if (resp.status === 200 || resp.status === 202) {
      expect(resp.data).toHaveProperty('success', true);
    }
  });

  test('POST /api/notification/email - reject invalid email address', async () => {
    const resp = await notificationHttp.post('/api/notification/email', {
      to: 'invalid-email',
      subject: 'Test',
      body: 'Test'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([400, 422]).toContain(resp.status);
    expect(resp.data).toHaveProperty('error');
  });
});
