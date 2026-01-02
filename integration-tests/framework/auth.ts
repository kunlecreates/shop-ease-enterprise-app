import { http, authHeaders } from './http';

export async function serviceToken() {
  // If CF service creds exist, return a header set to use for requests.
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    return authHeaders();
  }
  return {};
}

export async function adminLogin() {
  // Placeholder: implement real admin login flow if your app exposes it
  return { token: process.env.TEST_ADMIN_TOKEN || '' };
}

export async function loginAs(userRef: string) {
  // Placeholder login; replace with the actual auth call if available
  return { token: '' };
}
