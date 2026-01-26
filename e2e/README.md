Tests running in CI should use Cloudflare Access client credentials.

- Provide `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` as environment variables (or repository secrets).
- The Playwright test harness will add these as `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers on requests.

Do not rely on a `CF_AUTH_COOKIE` cookie for authentication in CI.
