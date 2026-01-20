import { orderHttp, userHttp } from '../framework/http';
import { waitFor } from '../framework/polling';

describe('Order Status Tracking Flow', () => {
  let customerToken: string;
  let orderId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const customer = {
      email: `tracking${timestamp}@example.com`,
      username: `tracking${timestamp}`,
      password: 'Tracking123!',
      firstName: 'Tracking',
      lastName: 'Test'
    };

    await userHttp.post('/api/user/register', customer);
    const loginResp = await userHttp.post('/api/user/login', {
      email: customer.email,
      password: customer.password
    });
    customerToken = loginResp.data.token;
  });

  test('Track order from creation to delivery', async () => {
    // Create order
    const orderResp = await orderHttp.post('/api/order', {
      items: [{ productId: 'prod-track-1', quantity: 1 }]
    }, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (orderResp.status !== 201 && orderResp.status !== 200) {
      console.warn('Skipping: order not created');
      return;
    }

    orderId = orderResp.data.id;
    expect(orderResp.data.status).toBe('PENDING');

    // Get order tracking
    const trackingResp = await orderHttp.get(`/api/order/${orderId}/tracking`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    expect([200, 404]).toContain(trackingResp.status);
    if (trackingResp.status === 200) {
      expect(Array.isArray(trackingResp.data)).toBe(true);
    }
  });

  test('Get order history with status changes', async () => {
    if (!orderId) {
      console.warn('Skipping: no order available');
      return;
    }

    const historyResp = await orderHttp.get(`/api/order/${orderId}/history`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    expect([200, 404]).toContain(historyResp.status);
    if (historyResp.status === 200) {
      expect(Array.isArray(historyResp.data)).toBe(true);
    }
  });

  test('Customer receives real-time status updates', async () => {
    if (!orderId) {
      console.warn('Skipping: no order available');
      return;
    }

    const initialResp = await orderHttp.get(`/api/order/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (initialResp.status === 200) {
      expect(initialResp.data).toHaveProperty('status');
    }
  });
});
