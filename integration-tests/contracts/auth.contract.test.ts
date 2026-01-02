import { authHeaders } from '../framework/http';

const maybe = process.env.E2E_BASE_URL ? test : test.skip;

maybe('Auth contract: service token headers are present', async () => {
  const headers = authHeaders();
  // If CF creds are configured, expect headers to contain them; otherwise test skipped
  if (process.env.CF_ACCESS_CLIENT_ID) {
    expect(headers['CF-Access-Client-Id']).toBe(process.env.CF_ACCESS_CLIENT_ID);
  } else {
    expect(Object.keys(headers).length).toBe(0);
  }
});
