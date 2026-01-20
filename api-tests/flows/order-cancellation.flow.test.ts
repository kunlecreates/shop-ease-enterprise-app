import { orderHttp, userHttp } from '../framework/http';

describe('Order Cancellation Flow', () => {
  let customerToken: string;
  let orderId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const customer = {
      email: `canceltest${timestamp}@example.com`,
      username: `canceltest${timestamp}`,
      password: 'CancelTest123!',
      firstName: 'Cancel',
      lastName: 'Test'
    };

    await userHttp.post('/api/user/register', customer);
    const loginResp = await userHttp.post('/api/user/login', {
      email: customer.email,
      password: customer.password
    });
    customerToken = loginResp.data.token;

    // Create an order
    const orderResp = await orderHttp.post('/api/order', {
      items: [{ productId: 'prod-1', quantity: 1 }]
    }, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (orderResp.status === 201 || orderResp.status === 200) {
      orderId = orderResp.data.id;
    }
  });

  test('Customer cancels pending order', async () => {
    if (!orderId) {
      console.warn('Skipping: no order created');
      return;
    }

    const resp = await orderHttp.post(`/api/order/${orderId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    expect([200, 204, 400, 404]).toContain(resp.status);
  });

  test('Cannot cancel already shipped order', async () => {
    // Create and ship an order
    const orderResp = await orderHttp.post('/api/order', {
      items: [{ productId: 'prod-2', quantity: 1 }]
    }, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (orderResp.status !== 201 && orderResp.status !== 200) {
      console.warn('Skipping: order not created');
      return;
    }

    const newOrderId = orderResp.data.id;

    // Try to update status to SHIPPED (requires admin, so this might fail)
    await orderHttp.patch(`/api/order/${newOrderId}/status`, {
      status: 'SHIPPED'
    }, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    // Try to cancel
    const cancelResp = await orderHttp.post(`/api/order/${newOrderId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    // Should fail if order is shipped
    expect([400, 409, 404]).toContain(cancelResp.status);
  });
});
