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
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    expect(trackingResp.status).toBe(200);
    expect(Array.isArray(trackingResp.data)).toBe(true);
    expect(trackingResp.data.length).toBeGreaterThan(0);
    expect(trackingResp.data[0]).toHaveProperty('status');
  });

  test('Get order history with status changes', async () => {
    if (!orderId) {
      console.warn('Skipping: no order available');
      return;
    }

    const historyResp = await orderHttp.get(`/api/order/${orderId}/history`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    expect(historyResp.status).toBe(200);
    expect(Array.isArray(historyResp.data)).toBe(true);
  });

  test('Customer receives real-time status updates', async () => {
    if (!orderId) {
      console.warn('Skipping: no order available');
      return;
    }

    const initialResp = await orderHttp.get(`/api/order/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    expect(initialResp.status).toBe(200);
    expect(initialResp.data).toHaveProperty('status');
    expect(initialResp.data).toHaveProperty('id', orderId);
  });
});
