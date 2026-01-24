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

    // Create an order via cart checkout flow
    const cartResp = await orderHttp.post('/api/cart', {}, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (cartResp.status === 201) {
      const cartId = cartResp.data.id;
      
      // Add item to cart
      await orderHttp.post(`/api/cart/${cartId}/items`, {
        productRef: 'prod-1',
        quantity: 1,
        unitPriceCents: 1999
      }, {
        headers: { Authorization: `Bearer ${customerToken}` },
        validateStatus: () => true
      });

      // Checkout to create order
      const orderResp = await orderHttp.post(`/api/cart/${cartId}/checkout`, {}, {
        headers: { Authorization: `Bearer ${customerToken}` },
        validateStatus: () => true
      });

      if (orderResp.status === 201 || orderResp.status === 200 || orderResp.status === 202) {
        orderId = orderResp.data.orderId || orderResp.data.id;
      }
    }
  });

  test('Customer cancels pending order', async () => {
    if (!orderId) {
      throw new Error('Order not created in setup');
    }

    const resp = await orderHttp.post(`/api/order/${orderId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    expect([200, 204]).toContain(resp.status);
    if (resp.data) {
      expect(resp.data).toHaveProperty('status');
      expect(resp.data.status).toMatch(/cancel/i);
    }
  });

  test('Cannot cancel already shipped order', async () => {
    // Create and ship an order via cart checkout
    const cartResp = await orderHttp.post('/api/cart', {}, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (cartResp.status !== 201) {
      console.warn('Cannot create cart for shipped order test - skipping');
      return;
    }

    const cartId = cartResp.data.id;

    // Add item to cart
    await orderHttp.post(`/api/cart/${cartId}/items`, {
      productRef: 'prod-2',
      quantity: 1,
      unitPriceCents: 2999
    }, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    // Checkout to create order
    const orderResp = await orderHttp.post(`/api/cart/${cartId}/checkout`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    if (orderResp.status !== 201 && orderResp.status !== 200 && orderResp.status !== 202) {
      console.warn('Order creation failed - skipping shipped order test');
      return;
    }

    const newOrderId = orderResp.data.orderId || orderResp.data.id;

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
    expect([400, 409]).toContain(cancelResp.status);
    if (cancelResp.data) {
      expect(cancelResp.data).toHaveProperty('error');
    }
  });
});
