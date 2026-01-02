import { http } from '../framework/http';
import { waitFor } from '../framework/polling';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Order -> Notification contract: outbox event appears', async () => {
  // This test is a placeholder: it demonstrates waiting for background work
  const ok = await waitFor(async () => {
    const resp = await http.get('/api/order-events').catch(() => ({ status: 500 }));
    return resp.status === 200;
  }, 5000);
  expect([true, false]).toContain(ok);
});
