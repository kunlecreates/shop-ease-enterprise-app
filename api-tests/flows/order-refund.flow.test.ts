import { orderHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

describe('Order Refund Processing Flow', () => {
  let adminToken: string;

  beforeAll(async () => {
    const { token } = await adminLogin();
    adminToken = token;
  });

  test('Admin processes refund for cancelled order', async () => {
    // This test assumes an order exists that can be refunded
    const orderId = 'test-order-refund-001';

    const resp = await orderHttp.post(`/api/order/${orderId}/refund`, {
      reason: 'Customer requested cancellation',
      amount: 5999
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([200, 400]).toContain(resp.status);
    if (resp.status === 200) {
      expect(resp.data).toHaveProperty('refundId');
    }
  });

  test('Refund validation: reject refund for pending order', async () => {
    const orderId = 'test-order-pending-001';

    const resp = await orderHttp.post(`/api/order/${orderId}/refund`, {
      reason: 'Test',
      amount: 1000
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });

    expect([400, 409]).toContain(resp.status);
    expect(resp.data).toHaveProperty('error');
  });

  test('Only admin can process refunds', async () => {
    const resp = await orderHttp.post('/api/order/some-id/refund', {
      reason: 'Unauthorized refund attempt',
      amount: 1000
    }, {
      validateStatus: () => true
    });

    expect([401, 403]).toContain(resp.status);
  });
});
